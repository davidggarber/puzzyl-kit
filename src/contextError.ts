import { _rawHtmlSource } from "./boilerplate";
import { complexAttribute, makeString } from "./builderContext";
import { consoleComment, pushRange } from "./builder";

export type SourceOffset = {
  source:string;
  offset?:number;
  length?:number;
}

/**
 * Custom error which identify which parts of the source document are malformed.
 * It can leverage nested try/catch blocks to add additional context.
 */
export class ContextError extends Error {
  public cause: Error|undefined;
  public callStack: string|undefined;
  public elementStack: Element[] | undefined;
  public functionStack: string[];
  public sourceStack: SourceOffset[];

  /**
   * Create a new ContextError (or derived error)
   * @param msg The message of the Error
   * @param source Indicates which source text specifically triggered this error
   * @param inner The inner/causal error, if any
   */
  constructor(msg: string, source?:SourceOffsetable, inner?:unknown) {
    super(msg);
    this.name = 'ContextError';
    if (inner instanceof Error) {
      this.cause = inner;
    } else if (inner !== undefined) {
      this.cause = new Error(String(inner));
    } else {
      this.cause = undefined;
    }
    this.functionStack = [];
    this.sourceStack = [];
    this.callStack = '';

    if (source) {
      if (typeof(source) == 'function') {
        this.sourceStack.push(source());
      }
      else {
        this.sourceStack.push(source);
      }
    }
  }

  _cacheCallstack():void {
    if (this.callStack === '') {
      this.callStack = this.cause ? this.cause.stack : this.stack;

      if (this.callStack?.substring(0, this.message.length) == this.message) {
        this.callStack = this.callStack.substring(this.message.length);  // REVIEW: trim \n ?
      }
    }
  }
}

/**
 * Type predicate to separate ContextErrors from generic errors.
 * @param err Any error
 * @returns true if it is a ContextError
 */
export function isContextError(err: unknown): err is ContextError {
  return err instanceof Error && err.name === 'ContextError';
}

/**
 * Instead of creating a source offset every time, anticipating an exception
 * that rarely gets thrown, instead pass a lambda.
 */
type SourceOffseter = () => SourceOffset;

/**
 * Methods generally take either flavor: SourceOffset or SourceOffseter
 */
export type SourceOffsetable = SourceOffset|SourceOffseter;

/**
 * Add additional information to a context error.
 * @param inner Another exception, which has just been caught.
 * @param func The name of the current function (optional).
 * @param elmt The name of the current element in the source doc (optional)
 * @param src The source offset that was being evaluated
 * @returns If inner is already a ContextError, returns inner, but now augmented.
 * Otherwise creates a new ContextError that wraps inner.
 */
export function wrapContextError(inner: unknown, func?: string, src?: SourceOffsetable) {
  let ctxErr: ContextError;
  if (isContextError(inner)) {
    ctxErr = inner;
  }
  else if (inner instanceof Error) {
    ctxErr = new ContextError(inner.name + ': ' + inner.message, undefined, inner);
  }
  else {
    ctxErr = new ContextError(String(inner));
  }

  // Cache callstack
  if (ctxErr.callStack === '') {
    ctxErr.callStack = ctxErr.cause ? ctxErr.cause.stack : ctxErr.stack;

    if (ctxErr.callStack?.substring(0, ctxErr.message.length) == ctxErr.message) {
      ctxErr.callStack = ctxErr.callStack.substring(ctxErr.message.length);  // REVIEW: trim \n ?
    }
  }

  if (func) {
    ctxErr.functionStack.push(func);
  }
  if (src) {
    if (typeof(src) == 'function') {
      src = src() as SourceOffset;
    }
    ctxErr.sourceStack.push(src);
  }

  makeBetterStack(ctxErr);

  return ctxErr;
}

/**
 * Once we've added context to the exception, update the stack to reflect it
 */
function makeBetterStack(err:ContextError):void {
  const msg = 'ContextError: ' + err.message;
  let str = msg;

  if (err.sourceStack.length > 0) {
    for (let i = 0; i < err.sourceStack.length; i++) {
      const c = err.sourceStack[i];
      str += '\n' + c.source;
      if (c.offset !== undefined) {
        str += '\n' + Array(c.offset + 1).join(' ') + '^';
        if (c.length && c.length > 1) {
          str += Array(c.length).join('^');
        }
      }
    }
  }

  if (err.callStack) {
    str += '\n' + err.callStack;
  }

  if (err.cause) {
    str += '\nCaused by: ' + err.cause;
  }

  // if (err.functionStack.length > 0) {
  //   str += "\nBuild functions stack:";
  //   for (let i = 0; i < err.functionStack.length; i++) {
  //     str += '\n    ' + err.functionStack[i];
  //   }
  // }

  err.stack = str;
}

export function nodeSourceOffset(node:Node):SourceOffset {
  if (node.nodeType == Node.ELEMENT_NODE) {
    return elementSourceOffset(node as Element)
  }
  else {
    const tok:SourceOffset = {
      source: node.nodeValue || '',  // for text elements, same as textContent
      offset: 0,
      length: 1,  // No need to span the whole
    }
    return tok;
  }
}

/**
 * Recreate the source for a tag. Then pinpoint the offset of a desired attribute.
 * @param elmt An HTML tag
 * @param attr A specific attribute, whose value is being evaluated.
 * @returns A source offset, built on the recreation
 */
export function elementSourceOffset(elmt:Element, attr?:string):SourceOffset {
  let str = '<' + elmt.localName;
  let offset = 0;
  let length = 0;

  for (let i = 0; i < elmt.attributes.length; i++) {
    const name = elmt.attributes[i].name;
    const value = elmt.attributes[i].value;
    if (name === attr) {
      offset = str.length + name.length + 3; // The start of the value
      length = value.length;
    }
    str += ' ' + elmt.attributes[i].name + '="' + elmt.attributes[i].value + '"';
  }

  if (attr && offset == 0) {
    // Never found the attribute we needed. Highlight the element name
    offset = 1;
    length = elmt.localName.length;
  }

  if (elmt.childNodes.length == 0) {
    str += ' /';  // show as empty tag
  }
  str += '>';  // close tag
  
  if (offset == 0) {
    length = str.length;  // Full tag
  }

  const tok:SourceOffset = { source: str, offset: offset, length: length };
  return tok;
}

/**
 * Instead of creating a source offset every time, anticipating an exception
 * that rarely gets thrown, instead pass a lambda.
 */
export function elementSourceOffseter(elmt:Element, attr?:string): SourceOffseter {
  return () => { return elementSourceOffset(elmt, attr); };
}

/**
 * A code error has no additional fields.
 * It just acknowledges that the bug is probably the code's fault, and not the raw inputs's.
 */
export class CodeError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'CodeError';
  }
}

/**
 * For debug traces, summarize a tag without including its children/contents
 * @param elmt Any HTML element
 * @returns A recreation of its start tag
 */
export function debugTagAttrs(elmt:Element, expandFormulas:boolean=false): string {
  let str = '<' + elmt.localName;
  for (let i = 0; i < elmt.attributes.length; i++) {
    let val = elmt.attributes[i].value;
    if (expandFormulas) {
      try {
        val = makeString(complexAttribute(val));
      }
      catch {
        val = "#ERROR#";  // 
      }
    }
    str += ' ' + elmt.attributes[i].name + '="' + val + '"';
  }
  if (elmt.childNodes.length == 0) {
    str += ' /';  // show as empty tag
  }
  str += '>';  // close tag
  return str;
}

/**
 * For debugging, mirror a builder tag as a comment inside the new tag it generated.
 * Show attributes in their raw version, potentially with formulas,
 * and again with resolved values, if different.
 * @param src The original builder element
 * @param dest The new element that replaces it, or else a list of elements
 * @param expandFormulas If true, try expanding formulas.
 * Don't use if the resolved formulas are at risk of being large (i.e. objects or lists)
 */
export function traceTagComment(src:Element, dest:Element|Node[], expandFormulas:boolean) {
  const dbg1 = debugTagAttrs(src);
  let complex:any;
  try {
    // Don't let an exception derail anything else
    complex = complexAttribute(dbg1);
    if (typeof(complex) !== "string" ) {
      complex = JSON.stringify(complex);
    }
  }
  catch (ex) {
    if (ex instanceof(Error)) {
      complex = ex.name + ': ' + ex.message;
    }
    else {
      complex = "Exception: " + ex;
    }
  }
  const cmt1 = consoleComment(dbg1 + "➟" + complex as string);
  if (Array.isArray(dest)) {
    pushRange(dest, cmt1);
  }
  else if (cmt1.length > 0) {
    (dest as Element).appendChild(cmt1[0]);
  }

  if (expandFormulas) {
    const dbg2 = debugTagAttrs(src,true);
    if (dbg2 !== dbg1) {
      const cmt2 = consoleComment(dbg2);
      if (Array.isArray(dest)) {
        pushRange(dest, cmt1);
      }
      else if (cmt2.length > 0) {
        (dest as Element).appendChild(cmt2[0]);
      }
    }  
  }
}