import { test, expect } from '@playwright/test';
import { tokenizeText, testBuilderContext, tokenizeFormula, treeifyFormula, evaluateFormula, cloneText } from '../src/builderContext';
import { SourceOffset, ContextError, isContextError, wrapContextError } from '../src/contextError';

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

function nothrowTokenizeText(raw:string):boolean {
  try {
    tokenizeText(raw);
    return true;
  }
  catch (ex) {
    return false;
  }
}

function catchTokenizeText(raw:string):SourceOffset|null {
  try {
    tokenizeText(raw);
    return null;
  }
  catch (ex) {
    const ctx = wrapContextError(ex);
    // console.log(ctx);  // Uncomment to visually verify
    return (ctx as ContextError).sourceStack[0];
  }
}

test('matched curlies', () => {
  expect(nothrowTokenizeText('{num}')).toBeTruthy();
  expect(nothrowTokenizeText('no curlies')).toBeTruthy();
});

test('mis-matched curlies', () => {
  expect(catchTokenizeText(' {started')?.offset).toEqual(1);
  expect(catchTokenizeText('ended}')?.offset).toEqual(5);
  expect(catchTokenizeText('{escaped`}')?.offset).toEqual(0);
});

function catchTreeify(raw:string):SourceOffset|null {
  try {
    const tokens = tokenizeFormula(raw);  // should not throw
    const node = treeifyFormula(tokens);  // can throw and rethrow
    return null;
  }
  catch (ex) {
    const ctx = wrapContextError(ex);
    // console.log(ctx);  // Uncomment to visually verify
    return (ctx as ContextError).sourceStack[0];
  }
}

test('treeify', () => {
  // Unfinished binary operator
  expect(catchTreeify('2+')?.offset).toEqual(1);
  expect(catchTreeify('+3')?.offset).toEqual(0);
  // Lone binary operator
  expect(catchTreeify('+')?.offset).toEqual(0);
  // Unfinished unary operator
  expect(catchTreeify(':')?.offset).toEqual(0);

  // Unclosed bracket
  expect(catchTreeify('(2+3')?.offset).toEqual(0);
  // Unopened bracket
  expect(catchTreeify('2+3)')?.offset).toEqual(3);

  // Empty brackets
  expect(catchTreeify('2+()')?.offset).toEqual(2);
  // Whitespace brackets
  expect(catchTreeify('2+( )')?.offset).toEqual(3);
  // Empty quotes are ok
  expect(catchTreeify('2+""')).toBeNull();

  // Unclosed quotes
  expect(catchTreeify('"hello`"')?.offset).toEqual(0);
  // Quote at end
  expect(catchTreeify("`'world'")?.offset).toEqual(7);

  // Implicit concatenation
  expect(catchTreeify("3'three'")?.offset).toEqual(1);
  expect(catchTreeify("'two'2")?.offset).toEqual(5);

  // Nested operators
  expect(catchTreeify('4*(2+3-)')?.offset).toEqual(6);
  expect(catchTreeify('4*(2+3/-)')?.offset).toEqual(7);
});

function catchEvaluate(raw:string):SourceOffset|null {
  try {
    const result = evaluateFormula(raw);
    return null;
  }
  catch (ex) {
    const ctx = wrapContextError(ex);
    // console.log(ctx);  // Uncomment to visually verify
    return (ctx as ContextError).sourceStack[0];
  }
}

test('evaluate', () => {
  // Not a number
  expect(catchEvaluate('1+3*pt')?.offset).toEqual(4);

  // Not a string
  expect(catchEvaluate("'fonts:'~fonts~'more'")?.offset).toEqual(9);

  // Bogus entity
  expect(catchEvaluate('@z;')?.offset).toEqual(1);
  expect(catchEvaluate('@z')?.offset).toEqual(1);

  // Index out of range
  expect(catchEvaluate('fonts.2')?.offset).toEqual(6);

  // Not a child
  expect(catchEvaluate('pt.z')?.offset).toEqual(3);

  // One variable as index into another, with re-rooting
  expect(catchEvaluate("fonts.zeroth")?.offset).toEqual(6);
})

function catchCloneText(raw:string):SourceOffset|null {
  try {
    const result = cloneText(raw, true);
    return null;
  }
  catch (ex) {
    const ctx = wrapContextError(ex);
    // console.log(ctx);  // Uncomment to visually verify
    return (ctx as ContextError).sourceStack[0];
  }
}

test('formulaInText', () => {

  expect(cloneText('this is {fonts.0}', true)).toEqual('this is bold');

  // innermost offset is relative to the formula, not the whole
  expect(catchCloneText('this is {fonts.3}')?.offset).toEqual(6);
})
