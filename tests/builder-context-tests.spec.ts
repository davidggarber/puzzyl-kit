import { test, expect } from '@playwright/test';
import { tokenizeText, testBuilderContext, valueFromContext, tokenizeFormula, FormulaNode, treeifyFormula, evaluateFormula, complexAttribute, FormulaToken } from '../src/builderContext';
import { isContextError } from '../src/contextError';

global.structuredClone = (val) => JSON.parse(JSON.stringify(val))

test.beforeEach(() => {
  expect(testBuilderContext({
    num: 1234,
    zeroth: 0,
    fonts: [ 'bold', 'italic' ],
    sentence: 'Unit tests are the best!',
    pt: { x: 3, y: 5 },
    nest: { alpha: { bravo: 1, charlie: 'delta' }, echo: { foxtrot: { golf: 'hotel' } } }
  }));
});

test.afterAll(() => {
  testBuilderContext()  // Reset builder
});

test('value', () => {
  expect(valueFromContext('num')).toEqual(1234);

  expect(valueFromContext('mum',true)).toEqual('');
});

function testTokenizeText(input:string, texts:string[], formulas:boolean[]) {
  expect(tokenizeText(input).map(t=>t.text)).toEqual(texts);
  expect(tokenizeText(input).map(t=>t.formula)).toEqual(formulas);
}

test('tokenizeText', () => {
  // 1 text token
  testTokenizeText('num', ['num'], [false]);

  // 1 formula token
  testTokenizeText('{num}', ['num'], [true]);

  // formula+text+formula
  testTokenizeText('{num} {pt}', ['num',' ','pt'], [true,false,true]);

  // escaped braces
  testTokenizeText('`{num`}', ['{num}'], [false]);

  // escaped and real braces
  testTokenizeText('`{{num}`}', ['{','num','}'], [false,true,false]);

  // escaped escapes and braces
  testTokenizeText('```{num```}', ['`{num`}'], [false]);

  // escaped escapes and real braces
  testTokenizeText('``{num}', ['`','num'], [false,true]);

  // entities don't apply outside formulas
  testTokenizeText('at@at;', ['at@at;'], [false]);

  // nested braces
  testTokenizeText('{pt.{x}}', ['pt.{x}'], [true]);

  // maybe ?operator
  testTokenizeText('{?maybe}', ['?maybe'], [true]);

});

const tokenShorthand:Record<number, string> = {
  0x1:'!',   // unary
  0x2:'.',   // binary
  0x3:'?',   // anyOperator
  0x10:'[',  // open
  0x20:']',  // close
  0x30:'|',  // anyBracket
  0x100:'t', // word
  0x200:'#', // number
  0x400:' ', // space
  0x1000:'@',// node
}

/**
 * Helper for testing a formula tokenization
 * @param input The raw formula to tokenize
 * @param texts A sequence of tokens' text, presented as a single string separated by commas
 * @param tokens A sequence of tokens' types, presented as shorthand (see above)
 */
function testTokenizeFormula(input:string, texts:string, shorthand:string) {
  let tokens:FormulaToken[];
  try {
    tokens = tokenizeFormula(input);
  }
  catch (ex) {
    console.log('Unexpected exception tokenizing formula ' + input)
    if (isContextError(ex)) {
      console.log(ex.toString());
    }
    throw ex;
  }
  if (tokens) {
    expect(tokens.map(t=>t.text)).toEqual(texts.split(','));
    expect(tokens.map(t=>t.type).map(ch => tokenShorthand[ch]).join('')).toEqual(shorthand);
  }
}

test('tokenizeFormula', () => {
  // 1 text token
  testTokenizeFormula('num', 'num', 't');

  // binary operator
  testTokenizeFormula('num+3', 'num,+,3', 't.#');

  // object operator
  testTokenizeFormula('line.start.x', 'line,.,start,.,x', 't.t.t');

  // whitespace is preserved at this first level, attached to adjacent text
  testTokenizeFormula(' num + 3 ', ' num ,+, 3 ', 't.#');

  // unary operator (with replacement char)
  testTokenizeFormula('-num', '⁻,num', '!t');

  // unary operator after binary
  testTokenizeFormula('2*-num', '2,*,⁻,num', '#.!t');

  // stacked unary operators (with both replacement chars)
  testTokenizeFormula('--2----num', '⁻,⁻,2,−,⁻,⁻,⁻,num', '!!#.!!!t');

  // several binary operators
  testTokenizeFormula('num+3*num\\5%10', 'num,+,3,*,num,\\,5,%,10', 't.#.t.#.#');

  // various brackets
  testTokenizeFormula('(aa+[bb-3]*(cc/4))', '(,aa,+,[,bb,−,3,],*,(,cc,/,4,),)', '[t.[t.#].[t.#]]');

  // quotes
  testTokenizeFormula('"abc"~\'def\'', '",abc,",~,\',def,\'', '[t].[t]');

  // escaped quotes
  testTokenizeFormula('`"abc`"~`\'def`\'', '"abc",~,\'def\'', 't.t');

  // escaped brackets
  testTokenizeFormula('"`(abc`)"~\'`[def`]\'', '",(abc),",~,\',[def],\'', '[t].[t]');

  // entities in formulas and in literals
  testTokenizeFormula('"test@at;"~@at;', '",test@at;,",~,@,at;', '[t].!t');

  // brackets and operators in quotes
  testTokenizeFormula('"(abc)"~\'[d"e+f]\'', '",(abc),",~,\',[d"e+f],\'', '[t].[t]');

  // whitespace, both in words and numbers, and alone
  testTokenizeFormula('"word " ~  (num + 2)', '",word ,", ,~,  ,(,num ,+, 2,)', '[t] . [t.#]');

  // root optional
  testTokenizeFormula('?maybe', '⸮,maybe', '!t');

  // child optional
  testTokenizeFormula('foo?maybe', 'foo,¿,maybe', 't.t');

  // Old post-fix maybe? operator is deprecated
  // testTokenizeFormula('maybe?', 'maybe?', 't');
});

/**
 * Helper for testing tree formation: rearrange an infix formula to prefix.
 * @param node A root/branch/leaf of a binary tree
 * @returns A list, starting with this node's value, then any left branch (recursive), then any right branch (recursive)
 */
function depthFirstValues(node:FormulaNode):string[] {
  const list:string[] = [node.value.text || ''];
  if (node.left) {
    list.push(...depthFirstValues(node.left));
  }
  if (node.right) {
    list.push(...depthFirstValues(node.right));
  }
  return list;
}

/**
 * Test building a formula into a tree.
 * @param raw The original formula
 * @param prefix A prefix notation (aka depth first) expression of the tree, with terms separated by commas
 */
function testTreeifyFormula(raw:string, prefix:string):boolean {
  try {
    const tokens = tokenizeFormula(raw);
    const tree = treeifyFormula(tokens);
    // expect(tree.value).toEqual(prefix.split(',')[0]);
    const dfv = depthFirstValues(tree).join(',');
    expect(dfv).toEqual(prefix);
    return true;
  }
  catch (ex) {
    console.log('Unexpected exception treeifying ' + raw)
    if (isContextError(ex)) {
      console.log(ex.toString());
    }
    console.log(ex);
    return false;
  }
}

test('treeifyFormula', () => {
  // Simple string
  expect(testTreeifyFormula("hello", 'hello')).toBeTruthy();

  // Simple number
  expect(testTreeifyFormula("321", '321')).toBeTruthy();

  // Binary operation
  expect(testTreeifyFormula("num*10", '*,num,10')).toBeTruthy();

  // Unary operation
  expect(testTreeifyFormula("-10", '⁻,10')).toBeTruthy();

  // Object operations
  expect(testTreeifyFormula(":sentence.(:magic%10)", '.,:,sentence,%,:,magic,10')).toBeTruthy();

  // Object operator precedence
  expect(testTreeifyFormula("pt.x+pt.y", '+,.,pt,x,.,pt,y')).toBeTruthy();

  // Multiple operations
  expect(testTreeifyFormula("num*-10", '*,num,⁻,10')).toBeTruthy();

  // Multiple operations with whitespace
  // Note: whitespace with text persists until evaluate()
  expect(testTreeifyFormula("num * -10", '*,num ,⁻,10')).toBeTruthy();

  // Parentheses
  expect(testTreeifyFormula("sentence.[2*(3+4)]", '.,sentence,*,2,+,3,4')).toBeTruthy();

  // Quotes
  // Note: 1st ~ in prefix is 2nd in infix
  expect(testTreeifyFormula("'My '~sentence~\"!!\"", '~,~,My ,sentence,!!')).toBeTruthy();

  // entities in formulas and in literals
  expect(testTreeifyFormula('"test@at;"~@at;', '~,test@at;,@,at;')).toBeTruthy();

  // Unary maybe
  expect(testTreeifyFormula("?maybe", '⸮,maybe')).toBeTruthy();

  // Binary maybe
  expect(testTreeifyFormula("foo?maybe", '¿,foo,maybe')).toBeTruthy();

  // Old post-fix maybe? operator is deprecated
  // expect(testTreeifyFormula('maybe?', 'maybe?')).toBeTruthy();
});

function testEvaluateFormulaTree(raw:string, result:string) {
  const tokens = tokenizeFormula(raw);
  const tree = treeifyFormula(tokens);
  expect(raw + '= ' + tree.evaluate(true)).toEqual(raw + '= ' + result);
}

test('evaluateFormulaTree', () => {

  // Simple string
  testEvaluateFormulaTree("hello", 'hello');

  // Simple number
  testEvaluateFormulaTree("321", '321');

  // Binary operation
  testEvaluateFormulaTree("num*10", '12340');

  // Unary operation
  testEvaluateFormulaTree("-10", '-10');

  // Object by name
  testEvaluateFormulaTree("pt.x", '3');

  // List by name
  testEvaluateFormulaTree("fonts", "bold,italic");

  // Object values with math and spaces
  testEvaluateFormulaTree("pt.x + pt.y", '8');

  // Object operations
  testEvaluateFormulaTree(":sentence.(:num%10)", ' ');

  // Multiple operations
  testEvaluateFormulaTree("num*-10", '-12340');

  // Multiple operations with whitespace
  testEvaluateFormulaTree("num * -10", '-12340');

  // Parentheses
  testEvaluateFormulaTree("sentence.[2*(3+5)]", 'h');

  // List index
  testEvaluateFormulaTree("fonts.0", 'bold');

  // Quotes
  testEvaluateFormulaTree("'My '~sentence~\"!!\"", 'My Unit tests are the best!!!');

  // Entities in formulas
  testEvaluateFormulaTree("'@' ~ @quot;", '@"');

  // Entities in text literals
  testEvaluateFormulaTree("'@at;@quot;'", '@"');

  // Numeric entities
  testEvaluateFormulaTree("@33;~@x33;~@#33;~@#x33;", '!3!3');

  testEvaluateFormulaTree("?maybe", '');
  testEvaluateFormulaTree("?num", '1234');

  testEvaluateFormulaTree("pt?x", '3');
  testEvaluateFormulaTree("pt?z", '');
  testEvaluateFormulaTree("fonts?1", 'italic');
  testEvaluateFormulaTree("fonts?2", '');

  testEvaluateFormulaTree("fonts?[pt?x]", '');

  // Old post-fix maybe? operator is deprecated
  // testEvaluateFormulaTree("maybe?", '');
  // testEvaluateFormulaTree("num?", '1234');
});

function testEvaluateFormulaAny(raw:string, obj:any) {
  const result = evaluateFormula(raw);
  // console.log(typeof(result));
  expect(typeof(result)).toEqual(typeof(obj));
  expect(result).toEqual(obj);
}

test('evaluateFormulaAny', () => {

  // Simple string
  testEvaluateFormulaAny("hello", 'hello');

  // Simple number
  testEvaluateFormulaAny("321", 321);

  // Binary operation
  testEvaluateFormulaAny("-num*10", -12340);

  // Object value by name
  testEvaluateFormulaAny("pt.x", 3);

  // Object by name
  testEvaluateFormulaAny("pt", {x:3,y:5});

  // List by name
  testEvaluateFormulaAny("fonts", ['bold','italic']);

  // Object values with math
  testEvaluateFormulaAny("pt.x+pt.y", 8);

  // Object operations
  testEvaluateFormulaAny(":sentence.(:num%10-1)", 't');

  // Quotes
  testEvaluateFormulaAny("'My '~sentence~\"!!\"", 'My Unit tests are the best!!!');

  // Entities
  testEvaluateFormulaAny('"code" ~ @quot; ~ ' + "'name'", 'code"name');

  // NCRs in text and formulas
  testEvaluateFormulaAny('"@#33;" ~ @(5*7)', '!#');

  // Concatenate text with numbers
  testEvaluateFormulaAny("'three' ~ pt.x", 'three3');
  testEvaluateFormulaAny("pt.y~'five'", '5five');

  // One root variable as index into another
  testEvaluateFormulaAny("fonts.:zeroth", 'bold');

  // Implicit re-root variable
  testEvaluateFormulaAny("fonts.[zeroth]", 'bold');

  // maybe ?operator
  testEvaluateFormulaAny("?maybe", '');
  testEvaluateFormulaAny("?num", 1234);
});

function testComplexAttribute(raw:string, obj:any) {
  const result = complexAttribute(raw);
  // console.log(typeof(result));
  expect(typeof(result)).toEqual(typeof(obj));
  expect(result).toEqual(obj);
}

test('complexAttribute', () => {
  // No formula
  testComplexAttribute("hello", 'hello');

  // No formula, but same name
  testComplexAttribute("num", 'num');

  // Simple number
  testComplexAttribute("321", "321");  // Text, not number

  // Context value
  testComplexAttribute("{num}", 1234);

  // Context value, concatenated with text
  testComplexAttribute("{num}-num", "1234-num");

  // Operator with whitespace
  testComplexAttribute("{num + 2}", 1236);

  // Object value by name
  testComplexAttribute("{pt.x}", 3);

  // Object by name. But don't cast object to string
  testComplexAttribute("pt: (x={pt.x},y={pt.y})", "pt: (x=3,y=5)");

  // maybe ?operator
  testComplexAttribute("{?num ~ ?maybe}", '1234');
});
