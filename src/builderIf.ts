import { consoleComment, expandContents, popBuilderElement, pushBuilderElement, pushRange, shouldThrow } from "./builder";
import { evaluateAttribute, keyExistsInContext, makeFloat } from "./builderContext";
import { isTag } from "./classUtil";
import { ContextError, debugTagAttrs, elementSourceOffset, elementSourceOffseter, traceTagComment, wrapContextError } from "./contextError";

export type ifResult = {
  passed:boolean;
  index:number;
}

/**
 * Potentially several kinds of if expressions:
 *   equality: <if test="var" eq="value">  
 *   not-equality: <if test="var" ne="value">  
 *   less-than: <if test="var" lt="value">  
 *   less-or-equal: <if test="var" le="value">  
 *   greater-than: <if test="var" gt="value">  
 *   greater-or-equal: <if test="var" ge="value">  
 *   contains: <if test="var" in="value">  
 *   not-contains: <if test="var" ni="value">  
 *   boolean: <if test="var">
 * @param src the <if>, <elseif>, or <else> element
 * @param result in/out parameter that determines whether any sibling in a sequence of if/else-if/else tags has passed yet
 * @returns a list of nodes, which will replace this <if> element
 */
export function startIfBlock(src:HTMLElement, result:ifResult):Node[] {
  const dest:Node[] = [];
  try {
    traceTagComment(src, dest, true);
  
    if (isTag(src, 'if')) {
      result.index = 1;
      // Each <if> tag resets the group's passed state
      result.passed = false;
    }
    else {
      if (result.index < 1) {
        throw new ContextError(src.tagName + ' without preceding <if>', elementSourceOffset(src));
      }
      if (isTag(src, 'else')) {
        result.index = -result.index;
      }
      else {
        result.index++;
      }
      if (result.passed) {
        // A prior sibling already passed, so all subsequent elseif and else blocks should abort.
        return [];
      }
    }

    let exists = evaluateAttribute(src, 'exists', false, false, false);
    let notex = evaluateAttribute(src, 'notex', false, false, true);
    let not = evaluateAttribute(src, 'not', true, false);
    let test = evaluateAttribute(src, 'test', true, false);

    if (isTag(src, 'else')) {
      result.passed = true;
    }
    else if (src.hasAttributeNS('', 'exists') || src.hasAttributeNS('', 'notex')) {
      if (exists === false || notex === true) {
        // Special case: calling one of these threw an exception, which is still informative
        result.passed = notex ? true : exists;
      }
      else if (src.hasAttributeNS('', 'exists')) {
        // Does this attribute exist at all?
        result.passed = exists;
      }
      else {
        // Does this attribute exist at all?
        result.passed = !notex;
      }
    }
    else if (not !== undefined) {
      result.passed = (not === 'false') || (not === '') || (not === null);
    }
    else if (test !== undefined) {
      const testTok = elementSourceOffseter(src, 'test');

      let value:string|null;
      if ((value = evaluateAttribute(src, 'eq', false, false)) !== undefined) {
        result.passed = test === value;  // REVIEW: no casting of either
      }
      else if ((value = evaluateAttribute(src, 'ne', false, false)) !== undefined) {  // not-equals
        result.passed = test !== value;  // REVIEW: no casting of either
      }
      else if ((value = evaluateAttribute(src, 'lt', false, false)) != null) {  // less-than
        result.passed = makeFloat(test, testTok) < makeFloat(value, elementSourceOffseter(src, 'lt'));
      }
      else if ((value = evaluateAttribute(src, 'le', false, false)) != null) {  // less-than or equals
        result.passed = makeFloat(test, testTok) <= makeFloat(value, elementSourceOffseter(src, 'le'));
      }
      else if ((value = evaluateAttribute(src, 'gt', false, false)) != null) {  // greater-than
        result.passed = makeFloat(test, testTok) > makeFloat(value, elementSourceOffseter(src, 'gt'));
      }
      else if ((value = evaluateAttribute(src, 'ge', false, false)) != null) {  // greater-than or equals
        result.passed = makeFloat(test, testTok) >= makeFloat(value, elementSourceOffseter(src, 'ge'));
      }
      else if ((value = evaluateAttribute(src, 'in', false, false)) != null) {  // string contains
        if (Array.isArray(value)) {
          result.passed = value.indexOf(test) >= 0;
        }
        else if (typeof(value) === 'string') {
          result.passed = value.indexOf(test) >= 0;
        }
        else if (typeof(value) === 'object') {
          result.passed = test in value;
        }
        else {
          throw new ContextError(typeof(value) + " value does not support 'in' queries", elementSourceOffset(src, 'in'));
        }
      }
      else if (value = evaluateAttribute(src, 'ni', false, false)) {  // string doesn't contain
        if (Array.isArray(value)) {
          result.passed = value.indexOf(test) < 0;
        }
        else if (typeof(value) === 'string') {
          result.passed = value.indexOf(test) < 0;
        }
        else if (typeof(value) === 'object') {
          result.passed = !(test in value);
        }
        else {
          throw new ContextError(typeof(value) + " value does not support 'not-in' queries", elementSourceOffset(src, 'in'));
        }
      }
      else if (value = evaluateAttribute(src, 'regex', false, false)) {  // regular expression
        const re = new RegExp(value);
        result.passed = re.test(test);
      }
      else {  // simple boolean
        result.passed = test === true || test === 'true';
      }
    }
    else {
      throw new ContextError('<' + src.localName + '> elements must have an evaluating attribute: test, not, exists, or notex');
    }
  }
  catch (ex) {
    const ctxerr = wrapContextError(ex, 'startIfBlock', elementSourceOffset(src));
    if (shouldThrow(ctxerr, src)) { throw ctxerr; }
  }

  if (result.passed) {
    pushBuilderElement(src);
    pushRange(dest, expandContents(src));
    popBuilderElement();
  }
  
  return dest;
}

