import { isDebug, isTrace, theBoiler } from "./boilerplate";
import { getTrimMode, normalizeName, TrimMode } from "./builder";
import { isTag } from "./classUtil";
import { SourceOffset, ContextError, wrapContextError, CodeError, elementSourceOffset, SourceOffsetable } from "./contextError";

/**
 * The root context for all builder functions
 * @returns the lookup object on the boiler.
 */
export function theBoilerContext(): Record<string, any> {
  return theBoiler().lookup || {};
}

const contextStack:object[] = [];

/**
 * Get the current builder context.
 * If needed, initialized from boilerplate.lookup
 * @returns The top context on the stack.
 */
export function getBuilderContext():Record<string, any> {
  if (contextStack.length == 0) {
    contextStack.push(theBoilerContext());
  }
  return contextStack[contextStack.length - 1];
}

/**
 * Inject a builder context for testing purposes.
 * @param lookup Any object, or undefined to remove.
 */
export function testBuilderContext(lookup?:Record<string, any>) {
  theBoiler().lookup = lookup;
  contextStack.splice(0, contextStack.length);  // clear
}

/**
 * Start a new top level builder context.
 * @param newContext If specified, this is the new context. If not, start from a clone of the current top context.
 * @returns The new context, which the caller may want to modify.
 */
export function pushBuilderContext(newContext?:Record<string, any>):Record<string, any> {
  if (newContext === undefined) {
    newContext = structuredClone(getBuilderContext());
  }
  contextStack.push(newContext);
  return getBuilderContext();
}

/**
 * Pop the builder context stack.
 * @returns The new top-level builder context.
 */
export function popBuilderContext():Record<string, any> {
  contextStack.pop();
  return getBuilderContext();
}

/**
 * Try to look up a key in the current context level.
 * @param key A key name
 * @param maybe If true, and key does not work, return ''. If false/omitted, throw on bad keys.
 * @returns The value from that key, or undefined if not present
 */
export function valueFromContext(key:string, maybe?:boolean):any {
  const context = getBuilderContext();
  return getKeyedChild(context, key, undefined, maybe);
}

/**
 * Look up a value, according to the context path cached in an attribute
 * @param path A context path
 * @param maybe If true, and key does not work, return ''. If false/omitted, throw on bad keys.
 * @returns Any JSON object
 */
export function valueFromGlobalContext(path:string, maybe?:boolean):any {
  if (path) {
    return getKeyedChild(theBoilerContext(), path, undefined, maybe);
  }
  return undefined;
}

/**
 * Finish cloning an HTML element
 * @param src The element being cloned
 * @param dest The new element, still in need of attributes
 */
export function cloneAttributes(src:Element, dest:Element) {
  for (let i = 0; i < src.attributes.length; i++) {
    const name = normalizeName(src.attributes[i].name);
    let value = src.attributes[i].value;
    try {
      value = cloneText(value, false);
      if (name == 'id') {
        dest.id = value;
      }
      else if (name == 'class') {
        if (value) {
          const classes = value.split(' ');
          for (let i = 0; i < classes.length; i++) {
            if (classes[i].length > 0) {
              dest.classList.add(classes[i]);
            }
          }
        }    
      }
      else if (name == 'xmlns') {
        // These are applied when the node is cloned, not here as an attribute
      }
      else {
        dest.setAttributeNS('', name, value);
      }
    }
    catch (ex) {
      throw wrapContextError(ex, 'cloneAttributes', elementSourceOffset(src, name));
    }
  }
}

/**
 * Finish cloning an HTML element
 * @param src The element being cloned
 * @param dest The new element, still in need of attributes
 * @param attributes A list of attributes we're willing to clone
 */
export function cloneSomeAttributes(src:Element, dest:Element, attributes:string[]) {
  for (let i = 0; i < attributes.length; i++) {
    const name = attributes[i];
    try {
      let value = src.getAttributeNS('', name);
      if (value !== null && value !== undefined) {
        value = cloneText(value, false);
        dest.setAttributeNS('', name, value);
      }
    }
    catch (ex) {
      throw wrapContextError(ex, 'cloneAttributes', elementSourceOffset(src, name));
    }
  }
}

/**
 * Process a text node which may contain {curly} formatting.
 * @param text A text node
 * @returns A list with 1 or 0 text nodes
 */
export function cloneTextNode(text:Text):Node[] {
  const str = text.textContent || '';
  const trimMode = getTrimMode();

  if (trimMode === TrimMode.pre) {
    const cloned = complexAttribute(str, TrimMode.off);
    
    // Trim each line. Use 0xA0 to lock in intended line starts
    let lines = (''+cloned).split('\n').map(l => simpleTrim(l));
    
    if (isTag(text.parentElement, 'pre')) {
      // The <pre> and </pre> tags often have their own boundary line breaks.
      // Trim a first blank link, after the opening <pre>
      if ((text.parentNode?.childNodes[0] === text) && lines[0] === '') {
        lines.splice(0, 1);
      }
      // Trim a final blank link, before the closing </pre>
      if ((text.parentNode?.childNodes[text.parentNode?.childNodes.length - 1] === text)
          && lines.length > 0 && lines[lines.length - 1] === '') {
        lines.splice(lines.length - 1, 1);
      }
    }
    const joined = lines.join('\n');
    return [document.createTextNode(joined)];
  }
  
  const cloned = complexAttribute(str, trimMode);
  if (cloned === '') {
    return [];
  }

  const node = document.createTextNode(cloned);
  return [node];
}

/**
 * Process text which may contain {curly} formatting.
 * @param str Any text, including text inside attributes
 * @param trueText should be true for text from text nodes, 
 * and false for text from attributes.
 * @returns Expanded text
 */
export function cloneText(str:string|null, trueText:boolean):string {
  if (str === null) {
    return '';
  }
  const trimMode = trueText ? getTrimMode() : TrimMode.off;
  const cloned = complexAttribute(str, Math.max(trimMode, TrimMode.on));
  return '' + cloned;
}

/**
 * Resolve an attribute, in situations where it can resolve to an object, 
 * and not just text. If any portion is text, then the entire will concatenate
 * as text.
 * @param str the raw attribute
 * @param trim whether any whitespace should be trimmed while processing. By default, off.
 * @returns an object, if the entire raw attribute string is a {formula}.
 * Otherwise a string, which may simply be a clone of the original.
 */
export function complexAttribute(str:string, trim:TrimMode = TrimMode.off):any {
  if (str === null) {
    return '';
  }
  
  if (trim != TrimMode.off) {
    str = simpleTrim(str);
  }

  const list = tokenizeText(str);

  let buffer = '';
  for (let i = 0; i < list.length; i++) {
    if (!list[i].formula) {
      if (trim == TrimMode.all) {
        buffer += simpleTrim(list[i].text);
      }
      else {
        buffer += list[i].text;
      }
    }
    else {
      try {
        const complex = evaluateFormula(list[i].text);
        if (i == 0 && list.length == 1) {
          return complex;
        }
        buffer += makeString(complex, list[i]);          
      }
      catch (ex) {
        throw wrapContextError(ex, 'complexAttribute', list[i]);
      }
    }
  }

  return buffer;
}

/**
 * Trim a string without taking non-breaking-spaces
 * @param str Any string
 * @returns A substring
 */
function simpleTrim(str:string):string {
  let s = 0;
  let e = str.length;
  while (s < e && (str.charCodeAt(s) || 33) <= 32) {
    s++;
  }
  while (--e > s && (str.charCodeAt(e) || 33) <= 32) {
    ;
  }
  return str.substring(s, e + 1);
}

enum TokenType {
  unset = 0,
  unaryOp = 0x1,  // sub-types of operator, when we get to that
  binaryOp = 0x2,
  anyOperator = 0x3,
  openBracket = 0x10,
  closeBracket = 0x20,
  anyBracket = 0x30,
  anyOperatorOrBracket = 0xff,
  word = 0x100,
  number = 0x200,
  spaces = 0x400,
  anyText = 0xf00,
  node = 0x1000,
}

export type FormulaToken = SourceOffset & {
  text?: string;
  type: TokenType;
  node?: FormulaNode;
}

/**
 * Divide up a string into sibling tokens.
 * Each token may be divisible into sub-tokens, but those are skipped here.
 * If we're not inside a {=formula}, the only tokens are { and }.
 * If we are inside a {=formula}, then operators and other brackets are tokens too.
 * @param str The parent string
 * @param inFormula True if str should be treated as already inside {}
 * @returns A list of token strings. Uninterpretted.
 * (Only exported for unit tests)
 */
export function tokenizeFormula(str:string): FormulaToken[] {
  const tokens:FormulaToken[] = [];
  const stack:string[] = [];  // currently open brackets

  let tok:FormulaToken = { text: '', type: TokenType.unset, 
    source: str, offset: 0, length: 0 };
  let escape = false;
  const len = str.length;
  for (let i = 0; i <= str.length; i++) {
    const ch = i < str.length ? str[i] : '';
    if (ch == '`') {
      if (!escape) {
        escape = true;
        continue;  // First one. Do nothing.
      }
      escape = false;
      // Fall through, and process second ` as normal text
    }
    
    const op = getOperator(ch);

    if (stack.length > 0 && !escape && ch == stack[stack.length - 1]) {
      // Found a matching close bracket
      stack.pop();
      if (tok.type != TokenType.unset) { tokens.push(tok); }        // push any token in progress
      tokens.push(tok = {  text:ch,  type:TokenType.closeBracket,   // push close bracket
        source: str, offset: i, length: 1 });  
      tok = { text: '', type: TokenType.unset,                      // reset next token
        source: str, offset: i + 1, length: 0 }; 
    }
    else if (!isInQuotes(stack) && !escape && (isBracketOperator(op) || isCloseBracket(op))) {
      // New open bracket, or unmatched close
      const type = isBracketOperator(op) ? TokenType.openBracket : TokenType.closeBracket;
      if (tok.type != TokenType.unset) { tokens.push(tok); }       // push any token in progress
      tokens.push(tok = { text:ch, type:type,                      // push open bracket
        source: str, offset: i, length: 1 });  
      if (type == TokenType.openBracket) {
        stack.push(op!.closeChar!);                                // cache the pending close bracket
      }
      tok = { text: '', type: TokenType.unset,                     // reset next token
        source: str, offset: i + 1, length: 0 };
    }
    else if (!isInQuotes(stack) && !escape && op !== null) {
      // Found an operator
      let tt:TokenType = TokenType.unset;
      if (isBinaryOperator(op)) { tt |= TokenType.binaryOp; }
      if (isUnaryOperator(op)) { tt |= TokenType.unaryOp; }
      if (tok.type != TokenType.unset) { tokens.push(tok); }   // push any token in progress
      tokens.push(tok = { text:ch, type:tt,                    // push operator (exact type TBD)
        source: str, offset: i, length: 1 });
      tok = { text: '', type: TokenType.unset,                 // reset next token
        source: str, offset: i + 1, length: 0 };
    }
    else {
      // Anything else is text
      if (escape && op == null) {
        tok.text += '`';  // Standalone escape. Treat as regular `
      }
      tok.text += ch;
      if (tok.text !== '') {
        tok.type = TokenType.anyText;
        tok.length = Math.min(i + 1,len) - tok.offset!;
      }
    }
    escape = false;
  }
  if (tok.type != TokenType.unset) { 
    tokens.push(tok);  // push any token in progress
  }

  // Re-scan tokens, to clarify operator and text sub-types
  let prev = TokenType.unset;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.source == undefined || tok.offset == undefined || tok.length == undefined) {
      throw new CodeError('All tokens should know their source offset: ' + tok);
    }
    if (tok.type & TokenType.anyOperator) {
      if ((prev & (TokenType.word | TokenType.number | TokenType.closeBracket)) == 0) {
        // If no object (text or a closeBracket) precedes us, we're a unary operator
        // For example, consecutive operators mean all but the first are unary (since we have no post-fix unary operators)
        tok.type = TokenType.unaryOp;
        const op = getOperator(tok.text!);
        tok.text = op!.unaryChar ?? tok.text;  // possibly substitute operator char
      }
      else if (tok.type & TokenType.anyOperator) {
        // When an object does precede us, then ambiguous operators are binary
        tok.type = TokenType.binaryOp;
        const op = getOperator(tok.text!);
        tok.text = op!.binaryChar ?? tok.text;  // possibly substitute operator char
      }
    }
    else if (tok.type & TokenType.anyText) {
      if (simpleTrim(tok.text!).length == 0) {
        tok.type = TokenType.spaces;
      }
      else if (isIntegerRegex(tok.text!)) {
        tok.type = TokenType.number;
      }
      else {
        tok.type = TokenType.word;
      }
    }
    
    if (tok.type != TokenType.spaces) {
      prev = tok.type;
    }
  }

  return tokens;
}

function findCloseBracket(tokens:FormulaToken[], open:number):number {
  const closes:FormulaToken[] = [tokens[open]];
  for (let i = open + 1; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type == TokenType.closeBracket) {
      if (tok.text == bracketPairs[closes[closes.length - 1].text!]) {
        closes.pop();
        if (closes.length == 0) {
          return i;
        }
      }
      else {
        throw new ContextError('Unmatched close bracket', tok);
      }
    }
    else if (tok.type == TokenType.openBracket) {
      closes.push(tok);
    }
  }
  throw new ContextError('Missing close ' + (isStringBracket(closes[closes.length - 1].text!) ? 'quotes' : 'brackets'), 
    closes[closes.length - 1]);
}

/**
 * A node of a formula's expression, which can be combined into a binary tree.
 * Each node also has a parent pointer, to support tree restructuring.
 * A single node is one of:
 *   plain text (could be a number)
 *   a unary operation, with an operator and its operand
 *   a binary operation, with an operator and two operands
 * If an operation, the operand(s) are also FormulaNodes.
 * Nodes are decorated with any immediate bracket, which affects text parsing.
 * (Only exported for unit tests)
 */
export class FormulaNode {
  value: FormulaToken;  // Doubles as the operator and the simple string value
  span: FormulaToken;   // For context, when debugging
  left?: FormulaNode;
  right?: FormulaNode;
  bracket: string = '';  // If this node is the root of a bracketed sub-formula, name the bracket char, else ''
  parent?: FormulaNode;

  constructor(value:FormulaToken, right?:FormulaNode, left?:FormulaNode, span?:FormulaToken) {
    this.left = left;
    this.right = right;
    this.value = value;
    this.span = span ? span : value;

    if (right) {
      right.parent = this;
    }
    if (left) {
      left.parent = this;
    }
  }

  /**
   * Recreate the expression, as text
   * @returns A string equivalent (including any brackets or quotes it was found inside)
   */
  toString(): string {
    const rbrace = this.bracket === '' ? '' : bracketPairs[this.bracket];
    if (this.left) {
      return this.bracket + this.left.toString() + ' ' + this.value.text! + ' ' + this.right?.toString() + rbrace;
    }
    else if (this.right) {
      return this.bracket + this.value.text! + ' ' + this.right?.toString() + rbrace;
    }
    else {
      return this.bracket + this.value.text! + rbrace;
    }
  }

  /**
   * Is this node plain-text?
   * @returns false if there is an operation and operands, else false
   */
  isSimple():boolean {
    return !this.left && !this.right;
  }

  reRootContext():boolean {
    return this.bracket == '[' || this.bracket == '{';
  }

  /**
   * Evaluate this node.
   * @param evalText if true, any simple text nodes are assumed to be named objects or numbers
   * else any simple text is just that. No effect for non-simple text.
   * @returns If it's a simple value, return it (any type).
   * If there's an operator and operands, return a type appropriate for that operator.
   */
  evaluate(evalText?:boolean): any {
    let result:any = undefined;

    if (this.left) {
      try {
        const op = getOperator(this.value.text!);
        const bop:undefined|BinaryOperator = op!.binaryOp;

        // right must also exist, because we're complete
        const lValue = this.left.evaluate(op!.evalLeft);
        const rValue = this.right!.evaluate(op!.evalRight || this.right!.reRootContext());

        if (!bop) {
          throw new ContextError('Unrecognize binary operator', this.value);
        }
        result = bop(lValue, rValue, this.left?.span, this.right?.span);
        if (isTrace() && isDebug()) {
          console.log(this.toString() + ' => ' + result);
        }
        if (result === undefined || Number.isNaN(result)) {
          throw new ContextError('Operation ' + op?.raw + ' resulted in ' + result + ' : ' + lValue + op?.raw + rValue, this.value);
        }
      }
      catch (ex) {
        throw wrapContextError(ex, 'evaluate:binary', this.span);
      }
    }
    else if (this.right) {
      try {
        const op = getOperator(this.value.text!);
        const uop:undefined|UnaryOperator = op!.unaryOp;
        const rValue = this.right.evaluate(op!.evalRight);
        if (!uop) {
          throw new ContextError('Unrecognize unary operator', this.value);
        }
        result = uop(rValue, this.right?.span);
        if (isTrace() && isDebug()) {
          console.log(this.toString() + ' => ' + result);
        }
        if (result === undefined || Number.isNaN(result)) {
          throw new ContextError('Operation ' + op?.raw + ' resulted in ' + result + ' : ' + op?.raw + rValue, this.value);
        }
      }
      catch (ex) {
        throw wrapContextError(ex, 'evaluate:unary', this.span);
      }
    }
    else if (this.bracket === '\"' || this.bracket === '\'') {
      // Reliably plain text
      result = resolveEntities(this.value.text);
    }
    else {
      result = resolveEntities(this.value.text!);  // unless overridden below
      let trimmed = simpleTrim(result);

      // const maybe = result && trimmed[trimmed.length - 1] == '?';
      // if (maybe) {
      //   trimmed = trimmed.substring(0, trimmed.length - 1);
      //   if (evalText === undefined) {
      //     evalText = true;
      //   }
      // }

      // Could be plain text (or a number) or a name in context
      if (evalText === true) {
        const context = getBuilderContext();
        if (trimmed in context) {
          result = context[trimmed];
          result = resolveEntities(result);
        }
        // else if (maybe) {
        //   return '';  // Special case
        // }
        else if (isIntegerRegex(trimmed)) {
          result = parseInt(trimmed);
        }
        else if (this.bracket == '{') {
          throw new ContextError('Name lookup failed', this.span);
        }
      }
    }
    if (isTrace() && isDebug()) {
      console.log(this.value + ' => ' + result);
    }
    return result;
  }
}

/**
 * Does this string look like an integer?
 * @param str any text
 * @returns true if, once trimmed, it's a well-formed integer
 */
function isIntegerRegex(str:string):boolean {
  return /^\s*-?\d+\s*$/.test(str);
}

/**
 * Of all the operators, find the one with the highest precedence.
 * @param tokens A list of tokens, which are a mix of operators and values
 * @returns The index of the first operator with the highest precedence,
 * or -1 if no remaining operators
 */
function findHighestPrecedence(tokens:FormulaToken[]): number {
  let precedence = -1;
  let first = -1;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type & TokenType.anyOperatorOrBracket) {
      const op = getOperator(tok.text ?? '');
      if (op) {
        if ((op.precedence || 0) > precedence) {
          precedence = op.precedence!;
          first = i;
        }
      }
    }
  }
  return first;
}

/**
 * Create a merged token, which spans the range between (inclusive) two existing tokens.
 * @param first The first token in the span
 * @param last The last token in the span
 * @param node The node this token spans, if one. If omitted, the type is assumed to be text
 * @returns A new token
 */
function makeSpanToken(first:FormulaToken, last:FormulaToken, node?:FormulaNode) {
  const start = Math.min(first.offset!, last.offset!);
  const end = Math.max(first.offset! + first.length!, last.offset! + last.length!);
  const tok:FormulaToken = {
    type: node ? TokenType.node : TokenType.word,
    node: node,    
    source: first.source,
    text: unescapeOperators(first.source.substring(start, end)),
    offset: start,
    length: end - start,
  };
  return tok;
}

/**
 * An edge case, to create a blank token between existing tokens.
 * @param before The token prior to the empty token
 * @returns An empty token, correctly positioned.
 */
function makeEmptyToken(before:FormulaToken) {
  const tok:FormulaToken = {
    type: TokenType.spaces,
    source: before.source,
    text: '',
    offset: before.offset! + before.length!,
    length: 0,
  };
  return tok;
}

/**
 * 2nd pass of formula parser.
 * Uses operator precedence. 
 * Finds the left-most of the highest-precedence operators.
 * Builds a node that binds that operator to its operand(s).
 * Replace that subset with the node, and repeat
 * @param tokens A sequence of tokens
 * @param bracket An encapsulating bracket, if any
 * @returns A single node
 * @throws an error if the formula is malformed: mismatched brackets or incomplete operators
 */
export function treeifyFormula(tokens:FormulaToken[], bracket?:FormulaToken):FormulaNode
{
  if (tokens.length == 0 && !bracket) {
    throw new CodeError('Cannot treeify without content');
  }

  const fullSpanTok = tokens.length > 0
    ? makeSpanToken(tokens[0], tokens[tokens.length - 1])
    : makeEmptyToken(bracket!);

  if (bracket && isStringBracket(bracket.text!)) {
    return new FormulaNode(fullSpanTok);
  }

  while (tokens.length > 0) {
    const opIndex = findHighestPrecedence(tokens);
    if (opIndex < 0) {
      // If well formed, there should only be a single non-space token left
      let node:FormulaNode|undefined = undefined;
      for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        if (tok.type != TokenType.spaces) {
          if (node) {
            // This is a 2nd token
            // REVIEW: Alternatively invent a concatenation node
            throw new ContextError('Consecutive tokens with no operator', tok);
          }
          if (tok.type == TokenType.node) {
            node = tok.node!;
          }
          else {
            node = new FormulaNode(tok);
            if (bracket) {
              node.bracket = bracket.text!;
            }
          }
        }
      }
      if (!node) {
        const tok = makeSpanToken(tokens[0], tokens[tokens.length - 1]);
        throw new ContextError('No value tokens in span', tok);
      }
      return node;
    }

    const opTok = tokens[opIndex];
    const ch = opTok.text!
    const op = getOperator(ch);
    
    if (isUnaryOperator(op)) {
      let r = opIndex + 1;
      while (r < tokens.length && tokens[r].type == TokenType.spaces) { 
        r++; 
      }
      if (r >= tokens.length) {
        throw new ContextError('Unary operator without following operand', opTok);
      }
      const rightSplit = tokens.splice(opIndex + 1, r - opIndex);
      const right = treeifyFormula(rightSplit);
      const node = new FormulaNode(opTok, right);
      const tok = makeSpanToken(opTok, rightSplit[rightSplit.length - 1], node);
      node.span = tok;
      tokens[opIndex] = tok;
    }

    else if (isBinaryOperator(op)) {
      let r = opIndex + 1;
      while (r < tokens.length && tokens[r].type == TokenType.spaces) { 
        r++; 
      }
      if (r >= tokens.length) {
        throw new ContextError('Binary operator without right operand', opTok);
      }
      const rightSplit = tokens.splice(opIndex + 1, r - opIndex);
      const right = treeifyFormula(rightSplit);

      let l = opIndex - 1;
      while (l >= 0 && tokens[l].type == TokenType.spaces) { 
        l--; 
      }
      if (l < 0) {
        throw new ContextError('Binary operator without left operand', opTok);
      }
      const leftSplit = tokens.splice(l, opIndex - l);
      const left = treeifyFormula(leftSplit);

      const node = new FormulaNode(opTok, right, left);
      const tok = makeSpanToken(leftSplit[0], rightSplit[rightSplit.length - 1], node);
      node.span = tok;
      tokens[l] = tok;
    }

    else if (isBracketOperator(op)) {
      const close = findCloseBracket(tokens, opIndex);
      const closeTok = tokens.splice(close, 1)[0];
      const nested = tokens.splice(opIndex + 1, close - opIndex - 1);
      const node = treeifyFormula(nested, opTok);
      node.bracket = op!.raw;
      const tok = makeSpanToken(opTok, closeTok, node);
      node.span = tok;
      tokens[opIndex] = tok;
    }
    else {
      throw new ContextError('Unknown operator ' + ch, opTok);
    }
  }

  if (fullSpanTok.length == 0) {
    throw new ContextError('Empty brackets yield no value', bracket);
  }
  throw new ContextError('Treeify reduced to an empty span', fullSpanTok);
}

/**
 * Evaluate a formula
 * @param str A single formula. The bracketing {} are assumed.
 * @returns A single object, list, or string
 */
export function evaluateFormula(str:string|null):any {
  if (str === null) {
    return '';
  }
  try {
    const tokens = tokenizeFormula(str);
    const node = treeifyFormula(tokens);
    return node.evaluate(true);  
  }
  catch (ex) {
    throw wrapContextError(ex, 'evaluateFormula');
  }
}

/**
 * Evaluate a single attribute of an HTML element
 * @param elmt The HTML element
 * @param attr The name of the attribute
 * @param implicitFormula Whether the contents of the attribute require {} to indicate a formula
 * @param required Whether the attribute is required, in which case it will throw if not present. 
 * Otherwise it would return undefined
 * @param onerr What to return in the special case of an exception. If omitted, exceptions throw.
 * @returns Any data type, or undefined if attr isn't present at all
 */
export function evaluateAttribute(elmt:Element, attr:string, implicitFormula:boolean, required?:boolean, onerr?:any):any {
  const val = elmt.getAttributeNS('', attr);
  if (!val) {
    if (required === false) {  // true by default
      return val == '' ? '' : undefined;  // empty string is interestingly different from missing
    }
    throw new ContextError('Missing required attribute: ' + attr, elementSourceOffset(elmt));
  }
  try {
    if (implicitFormula) {
      return evaluateFormula(val);
    }
    return complexAttribute(val);
  }
  catch (ex) {
    if (onerr !== undefined) {
      return onerr;
    }
    throw wrapContextError(ex, undefined, elementSourceOffset(elmt, attr));
  }

}

/* Context formula syntax has several components that need to play nicely with each other.
   Brackets:
     {} to start lookups
     [] to start secondary, nested lookups
     () to do operator precedence, within formulas
   Fields:
     a-z0-9_   normal javascript field name rules
     .         separator
     ?         indicates optional (sub-)fields
   Generated field suffixes:
     #  index in a loop
     !  value of a key
     $  ???
   Operators:
     +-*\%/   numeric operators
     &@       string operators
     .?:      object and context operators

 */


const bracketPairs: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  // '<': '>',  // should never be used for comparison operators in this context
  '"': '"',
  "'": "'",
}

/**
 * Most brackets can stack inside each other, but once we have quotes, we're done
 * @param stack a stack of pending close brackets, i.e. what we're inside of
 * @returns true if the innermost bracket is " or '
 */
function isInQuotes(stack:string[]) {
  return stack.length > 0 
    && (stack[stack.length - 1] == '"' || stack[stack.length - 1] == '\'');
}

/**
 * Is this character normally a bracket, and therefore in need of escaping?
 * @param ch 
 * @returns 
 */
function isBracketChar(ch:string):boolean {
  return ch in bracketPairs
    || ch == ')' || ch == ']' || ch == '}';
}

/**
 * Convert any type to a number, or throw in broken cases.
 * @param a Any data, but hopefully an int or float
 * @param tok The source offset, if caller knows it
 * @returns The float equivalent
 */
export function makeFloat(a:any, tok?:SourceOffsetable):number {
  const f = parseFloat(a);
  if (Number.isNaN(f)) {
    throw new ContextError('Not a number: ' + JSON.stringify(a), tok);
  }
  return f;
}

/**
 * Convert any type to an integer, or throw in broken cases.
 * @param a Any data, but hopefully an int
 * @param tok The source offset, if caller knows it
 * @returns The int equivalent
 */
export function makeInt(a:any, tok?:SourceOffsetable):number {
  if (typeof(a) == 'number') {
    if (Math.trunc(a) == a) {
      return a;
    }
  }
  else if (isIntegerRegex('' + a)) {
    return parseInt(a);
  }
  throw new ContextError('Not an integer: ' + a, tok);
}

/**
 * Convert any type to string, or throw in broken cases.
 * @param a Any data, but hopefully string-friendly
 * @param tok The source offset, if caller knows it
 * @returns The string equivalent
 */
export function makeString(a:any, tok?:SourceOffsetable):string {
  if (a === undefined || a === null || typeof(a) == 'object') {
    throw new ContextError('Bad cast to string: ' + JSON.stringify(a), tok);
  }
  return String(a);
}

type UnaryOperator = (a:any,aa?:SourceOffsetable) => any;
type BinaryOperator = (a:any,b:any,aa?:SourceOffsetable,bb?:SourceOffsetable) => any;

type OperatorInfo = {
  raw: string;
  precedence?: number;  // higher numbers should evaluate before lower
  unaryChar?: string;  // if a unaryOp, replace text for a unique operator
  binaryChar?: string;  // if a binaryOp, replace text for a unique operator
  closeChar?: string;  // only for brackets
  unaryOp?: UnaryOperator;  // only supports prefixed unary operators: -4, but not 4!
  binaryOp?: BinaryOperator;
  evalLeft?: boolean;
  evalRight?: boolean;
}

const minus:OperatorInfo = { raw:'-', unaryChar:'⁻', binaryChar:'−'};  // ambiguously unary or binary minus
const optional:OperatorInfo = { raw:'?', unaryChar:'⸮', binaryChar:'¿'};  // ambiguously unary or binary optional child
const concat:OperatorInfo = { raw:'~', precedence:1, binaryOp:(a,b,aa,bb) => {return makeString(a,aa) + makeString(b,bb)}, evalLeft:true, evalRight:true};
const entity:OperatorInfo = { raw:'@', precedence:2, unaryOp:(a,aa) => {return entitize(a, aa)}, evalRight:false};
const plus:OperatorInfo = { raw:'+', precedence:3, binaryOp:(a,b,aa,bb) => {return makeFloat(a,aa) + makeFloat(b,bb)}, evalLeft:true, evalRight:true};
const subtract:OperatorInfo = { raw:'−', precedence:3, binaryOp:(a,b,aa,bb) => {return makeFloat(a,aa) - makeFloat(b,bb)}, evalLeft:true, evalRight:true};
const times:OperatorInfo = { raw:'*', precedence:4, binaryOp:(a,b,aa,bb) => {return makeFloat(a,aa) * makeFloat(b,bb)}, evalLeft:true, evalRight:true};
const divide:OperatorInfo = { raw:'/', precedence:4, binaryOp:(a,b,aa,bb) => {return makeFloat(a,aa) / makeFloat(b,bb)}, evalLeft:true, evalRight:true};
const intDivide:OperatorInfo = { raw:'\\', precedence:4, binaryOp:(a,b,aa,bb) => {const f=makeFloat(a,aa) / makeFloat(b,bb); return f >= 0 ? Math.floor(f) : Math.ceil(f)}, evalLeft:true, evalRight:true};  // integer divide without Math.trunc
const modulo:OperatorInfo = { raw:'%', precedence:4, binaryOp:(a,b,aa,bb) => {return makeFloat(a,aa) % makeFloat(b,bb)}, evalLeft:true, evalRight:true};
const negative:OperatorInfo = { raw:'⁻', precedence:5, unaryOp:(a,aa) => {return -makeFloat(a,aa)}, evalRight:true};
const childObj:OperatorInfo = { raw:'.', precedence:6, binaryOp:(a,b,aa,bb) => {return getKeyedChild(a, b, bb, false)}, evalLeft:true, evalRight:false};
const optionalChildObj:OperatorInfo = { raw:'¿', precedence:6, binaryOp:(a,b,aa,bb) => {return getKeyedChild(a, b, bb, true)}, evalLeft:true, evalRight:false};
const rootObj:OperatorInfo = { raw:':', precedence:7, unaryOp:(a,aa) => {return getKeyedChild(null,a,aa)}, evalRight:false};
const optionalRootObj:OperatorInfo = { raw:'⸮', precedence:7, unaryOp:(a,aa) => {return getKeyedChild(null,a,aa,true)}, evalRight:false};
const roundBrackets:OperatorInfo = { raw:'(', precedence:8, closeChar:')'};
const squareBrackets:OperatorInfo = { raw:'[', precedence:8, closeChar:']'};
const curlyBrackets:OperatorInfo = { raw:'{', precedence:8, closeChar:'}'};
const closeRoundBrackets:OperatorInfo = { raw:')', precedence:0};
const closeSquareBrackets:OperatorInfo = { raw:']', precedence:0};
const closeCurlyBrackets:OperatorInfo = { raw:'}', precedence:0};
const singleQuotes:OperatorInfo = { raw:'\'', precedence:10, closeChar:'\''};
const doubleQuotes:OperatorInfo = { raw:'"', precedence:10, closeChar:'"'};

const allOperators:OperatorInfo[] = [
  minus, optional,
  concat, plus, subtract, entity, 
  times, divide, intDivide, modulo, negative,
  childObj, rootObj, optionalChildObj, optionalRootObj,
  roundBrackets, squareBrackets, curlyBrackets,
  closeRoundBrackets, closeSquareBrackets, closeCurlyBrackets,
  singleQuotes, doubleQuotes
];

// Convert the list to a dictionary, keyed on the raw string
// (accumulate each item in the list into a field in acc, which starts out as {})
const operatorLookup: Record<string, OperatorInfo> = allOperators.reduce((acc, obj) => { 
  acc[obj.raw] = obj; 
  return acc; 
}, {} as Record<string, OperatorInfo>);

function isOperator(ch:string) {
  return ch in operatorLookup;  // ✓ Now ch can safely index operatorLookup
}

function getOperator(ch:string|OperatorInfo|null):OperatorInfo|null {
  if (ch === null) {
    return null;
  }
  if (typeof ch === 'string') {
    if (ch in operatorLookup) {
      return operatorLookup[ch];
    }
    return null;
  }
  return ch as OperatorInfo;
}

function isUnaryOperator(ch:string|OperatorInfo|null) {
  const op = getOperator(ch);
  return op !== null
    && (op.unaryChar !== undefined || op.unaryOp !== undefined);
}

function isBinaryOperator(ch:string|OperatorInfo|null) {
  const op = getOperator(ch);
  return op !== null
    && (op.binaryChar !== undefined || op.binaryOp !== undefined);
}

function isBracketOperator(ch:string|OperatorInfo|null) {
  const op = getOperator(ch);
  return op !== null && op.closeChar !== undefined;
}

function isCloseBracket(ch:string|OperatorInfo|null) {
  const op = getOperator(ch);
  return op == closeRoundBrackets || op == closeSquareBrackets || op == closeCurlyBrackets;
}

function isStringBracket(ch:string|OperatorInfo|null) {
  const op = getOperator(ch);
  return op !== null && (op.raw == '"' || op.raw == '\'');
}

/**
 * A few common named entities
 */
const namedEntities: Record<string, string> = {
  'quot': '"',
  'apos': '\'',
  'lt': '<',
  'gt': '>',
  'lb': '{',  // not the real name. It should be &lbrace;
  'rb': '}',  // not the real name. It should be &rbrace;
  'lbrace': '{',
  'rbrace': '}',
  'amp': '&',
  'tilde': '~',
  'at': '@',
  'nbsp': '\xa0',
}

/**
 * Convert an entity term into simple text.
 * Note that the entity prefix is # rather than &, because & injects an actual entity, which becomes text before we see it.
 * Supports decimal @34; and hex @x22; and a few named like @quot;
 * @param str the contents of the entity, after the @, up to the first semicolon
 * @returns a single character, if known, else throws an exception
 */
function entitize(str:any, tok?:SourceOffsetable):string {
  if (typeof(str) == 'number') {
    return String.fromCharCode(str);
  }
  str = makeString(str, tok);
  if (str) {
    str = simpleTrim(str);
    if (str.indexOf(';') == str.length - 1) { str = str.substring(0, str.length - 1); } // trim optional trailing semicolon
    if (str[0] == 'x' || str[0] == '#' || (str[0] >= '0' && str[0] <= '9')) {
      if (str[0] == '#') { str = str.substring(1); }  // # isn't required, but allow it like HTML NCRs
      let code = 0;
      if (str[0] == 'x') {
        str = str.substring(1);
        code = parseInt(str, 16);
        // REVIEW: will fromCharCode work for codes > 0x10000?
      }
      else {
        code = parseInt(str, 10);
      }
      return String.fromCharCode(code);
    }
    if (str in namedEntities) {
      return namedEntities[str];
    }
  }
  if (tok) {
    throw new ContextError('Not a recognized entity: ' + str, tok);
  }
  return '';
}

/**
 * Find any entities in a text string, and convert to 
 * Escape characters elsewhere are left.
 * @param raw A string which may contain `
 * @returns The unescapes, user-friendly string
 */
function resolveEntities(raw:any):any {
  if (typeof(raw) != 'string') {
    return raw;
  }
  let str = '';
  let start = 0;
  while (start <= raw.length) {
    const at = raw.indexOf('@', start);
    if (at < 0) {
      str += raw.substring(start);
      break;
    }
    str += raw.substring(start, at);

    const semi = raw.indexOf(';', at + 1);
    if (semi < 0) {
      // Not a valid entity. Treat as plain text.
      str += raw.substring(at);
      break;
    }

    const ent = entitize(raw.substring(at + 1, semi + 1));
    if (ent == '') {
      // Ignore any malformed entities
      str += '@';
      start = at + 1;
    }
    else {
      str += ent;
      start = semi + 1;
    }
  }
  return str;
}

/**
 * Each token in a text string is either plain text or a formula that should be processed.
 */
type TextToken = SourceOffset & {
  text: string;
  formula: boolean;
}

/**
 * Find the next instance of a character, making sure the character isn't escaped.
 * In our custom library, the escape character is a prefixed `
 * The only thing that can be escaped is brackets () [] {} "" '', and the ` itself.
 * Anywhere else, ` is simply that character.
 * @param raw The raw HTML content
 * @param find The character the search for
 * @param start The first position in the raw HTML
 * @returns the index of the character, if found, or else -1 if not found
 */
function findNonEscaped(raw:string, find:string, start:number) {
  while (start < raw.length) {
    let curly = raw.indexOf(find, start);
    if (curly > 0) {
      let esc = 0;
      while (curly - esc > 0 && raw[curly - esc - 1] == '`') {
        esc++;
      }
      if ((esc % 2) == 1) {
        // An odd number of back-slashes means the curly itself is escaped.
        // An even number means the back-slash is itself escaped, but not the curly
        start = curly + 1;
        continue;
      }
    }
    return curly;
  }
  return -1;
}

/**
 * Remove any escape characters preceding curly braces.
 * Since those braces have other meanings when not escaped, 
 * then their sheer presence means they were escaped.
 * @param raw A string which may contain `{ or even ```{
 * @returns A somg;e
 */
function unescapeBraces(raw:string):string {
  let str = '';
  let start = 0;
  while (start <= raw.length) {
    let i = raw.indexOf('`', start);
    if (i < 0) {
      str += raw.substring(start);
      break;
    }
    str += raw.substring(start, i);
    const ch = i + 1 < raw.length ? raw[i + 1] : '';
    if (ch == '`' || ch == '{' || ch == '}') {
      // drop the ` escape, and keep the next char
      str += ch;
      start = i + 2;
    }
    else {
      str += '`';  // not a real escape
      start = i + 1;
    }
  }
  return str;
}

/**
 * Remove any escape characters before operators.
 * Escape characters elsewhere are left.
 * @param raw A string which may contain `
 * @returns The unescapes, user-friendly string
 */
function unescapeOperators(raw:string):string {
  let str = '';
  let start = 0;
  while (start <= raw.length) {
    let i = raw.indexOf('`', start);
    if (i < 0) {
      str += raw.substring(start);
      break;
    }
    str += raw.substring(start, i);
    const ch = i + 1 < raw.length ? raw[i + 1] : '';
    const op = getOperator(ch);
    if (op !== null || ch == '`') {
      str += ch;  // The character after the escape
    }
    else {
      str += '`' + ch  // Not a real escape
    }
    start = i + 2;
  }
  return str;
}

/**
 * Parse text that occurs inside a built control element into tokens.
 * @param raw the raw document text
 * @param implicitFormula if true, the full text can be a formula without being inside {}.
 * (Only exported for unit tests)
 */
export function tokenizeText(raw:string, implicitFormula?:boolean):TextToken[] {
  implicitFormula = implicitFormula || false;
  const list:TextToken[] = [];

  let start = 0;
  while (start < raw.length) {
    let curly = findNonEscaped(raw, '{', start);

    let errorClose = findNonEscaped(raw, '}', start);
    if (errorClose >= start && (curly < 0 || errorClose < curly)) {
      const src:SourceOffset = {source:raw, offset:errorClose, length:1};
      throw new ContextError('Close-curly brace without an open brace.', src);
    }

    if (curly < 0) {
      break;
    }

    if (curly > start) {
      // Plain text prior to a formula
      const ttoken:TextToken = {
        text: unescapeBraces(raw.substring(start, curly)),
        formula: false,
        source: raw,
        offset: start,
        length: curly - start,
      };
      list.push(ttoken);  
    }

    let count = 1;
    let inner = curly + 1;
    while (count > 0) {
      let lb = findNonEscaped(raw, '{', inner);
      let rb = findNonEscaped(raw, '}', inner);
      if (rb < 0) {
        const src:SourceOffset = {source:raw, offset:curly, length:1};
        throw new ContextError('Unclosed curly braces.', src);
      }
      if (lb >= 0 && lb < rb) {
        count++;
        inner = lb + 1;
      }
      else {
        count--;
        inner = rb + 1;
      }
    }
    // The contents of the formula (without the {} braces)
    const ftoken:TextToken = {
      text: unescapeOperators(raw.substring(curly + 1, inner - 1)),
      formula: true,
      source: raw,
      offset: curly + 1,
      length: inner - 1 - curly - 1,
  };
    list.push(ftoken);
    start = inner;
  }
  if (start < raw.length) {
    // Any remaining plain text
    const isFormula = implicitFormula && start == 0;
    const ttoken:TextToken = {
      text: isFormula ? unescapeOperators(raw) : unescapeBraces(raw.substring(start)),
      formula: isFormula,
      source: raw,
      offset: start,
      length: raw.length - start,
  };
    list.push(ttoken);  
  }
  return list;
}

/**
 * Test a key in the current context
 * @param key A key, initially from {curly} notation
 * @returns true if key is a valid path within the context
 */
export function keyExistsInContext(key:string) {
  try {
    const a = evaluateFormula(key);
    // null, undefined, or '' count as not existing
    return a !== null && a !== undefined && a !== '';
    // Note: empty {} and [] do count as existing.
  }
  catch {
    return false;
  }
}

/**
 * Enable lookups into the context by key name.
 * Keys can be paths, separated by dots (.)
 * Paths can have other paths as nested arguments, using [ ]
 * Note, the dot separator is still required.
 *   example: foo.[bar].fuz       equivalent to foo[{bar}].fuz
 *   example: foo.[bar.baz].fuz   equivalent to foo[{bar.baz}].fuz
 * Even arrays use dot notation: foo.0 is the 0th item in foo
 * @param key A key, initially from {curly} notation
 * @returns Resolved text
 */
export function textFromContext(key:string|null):string {
  const obj = evaluateFormula(key);
  return makeString(obj);
}


/**
 * Get a keyed child of a parent, where the key is either a dictionary key 
 * or a list index or a string offset.
 * @param parent The parent object: a list, object, or string, which could in turn be the name of a list or object.
 * If null, the parent becomes the root boiler context.
 * @param key The identifier of the child: a dictionary key, a list index, or a string offset.
 * @param kTok The source offset of the token, if caller knows it.
 * @param maybe If true, and key does not work, return ''. If false/omitted, throw on bad keys.
 * @returns A child object, or a substring
 */
function getKeyedChild(parent:any, key:any, kTok?:SourceOffsetable, maybe?:boolean):any {
  if (parent === null) {
    // When !maybe && !parent, this is the root : operator.
    // When maybe && !parent, this is the maybe ? operator, which can be a <use> param.
    parent = maybe ? getBuilderContext() : theBoilerContext();
  }

  let index:number|undefined = undefined;
  if (typeof(key) == 'number') {
    index = key;
  }
  else if (isIntegerRegex('' + key)) {
    index = parseInt('' + key);
  }

  if (typeof(parent) == 'string') {
    // If the parent is a string, the only key we support is a character index
    if (index !== undefined) {
      if (index < 0 || index >= (parent as string).length) {
        if (maybe) {
          return '';
        }
        throw new ContextError('Index out of range: ' + index + ' in ' + parent, kTok);
      }
      return (parent as string)[index];
    }
    if (maybe) {
      return '';
    }
    throw new ContextError('Named fields are only available on objects: ' + key + ' in ' + JSON.stringify(parent), kTok);
  }

  if (index !== undefined && Array.isArray(parent)) {
    // Indexing into a list. Objects with keys that looks like numbers is handled below.
    if (index < 0 || index >= parent.length) {
      if (maybe) {
        return '';
      }
      throw new ContextError('Index out of range: ' + index + ' in ' + parent, kTok);
    }
    return parent[index];
  }

  // Named members of objects
  let trimmed = simpleTrim(key);
  // if (trimmed[trimmed.length - 1] == '?') {
  //   trimmed = trimmed.substring(0, trimmed.length - 1);
  //   maybe = true;
  // }
  if (!(trimmed in parent)) {
    if (maybe) {
      return '';
    }
    throw new ContextError('Key not found in context: ' + trimmed, kTok);
  }
  return parent[trimmed];
}
