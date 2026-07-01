import { consoleComment, expandContents, popBuilderElement, pushBuilderElement, pushRange, splitEmoji } from "./builder";
import { cloneText, evaluateAttribute, makeInt, makeString, popBuilderContext, pushBuilderContext } from "./builderContext";
import { ContextError, debugTagAttrs, elementSourceOffset, elementSourceOffseter } from "./contextError";

/**
 * Potentially several kinds of for loops:
 * for each: <for each="var" in="list">  // ideas for optional args: first, last, skip
 * for char: <for char="var" in="text">  // every character in a string
 * for word: <for word="var" in="text">  // space-delimited substrings
 * for range: <for range="var" from="first" to="last" or until="after"> 
 * for key: <for key="var" in="object">  // idea for optional arg: sort
 * @param src the <for> element
 * @param context the set of values that might get used by the for loop
 * @returns a list of nodes, which will replace this <for> element
 */
export function startForLoop(src:HTMLElement):Node[] {
  const dest:Node[] = [];
  pushRange(dest, consoleComment(debugTagAttrs(src)));

  let iter:string|null = null;
  let list:any[] = [];
  let vals:any[] = [];  // not always used

  // <for each="variable_name" in="list">
  iter = getIterationVariable(src,'each');
  if (iter) {
    list = parseForEach(src);
  }
  else {
    iter = getIterationVariable(src,'char');
    if (iter) {
      list = parseForText(src, '');
    }
    else {
      iter = getIterationVariable(src,'word');
      if (iter) {
        list = parseForText(src, ' ');
      }
      else {
        iter = getIterationVariable(src,'key');
        if (iter) {
          list = parseForKey(src);
          vals = list[1];
          list = list[0];
        }
        else {
          // range and int are synonyms
          iter = getIterationVariable(src,'range') || getIterationVariable(src,'int');
          if (iter) {
            list = parseForRange(src);
          }
          else {
            throw new ContextError('Unrecognized <for> tag type', elementSourceOffset(src));
          }
        }
      }
    }
  }

  if (!list) {
    throw new ContextError('Unable to determine loop', elementSourceOffset(src));
  }

  pushRange(dest, consoleComment('Iterating ' + iter + ' over ' + list.length + ' items...'));

  pushBuilderElement(src);
  const inner_context = pushBuilderContext();
  const iter_index = iter + '#';
  for (let i = 0; i < list.length; i++) {
    pushRange(dest, consoleComment(iter + ' #' + i + ' == ' + JSON.stringify(list[i])));
    inner_context[iter_index] = i;
    inner_context[iter] = list[i];
    if (vals.length > 0) {
      // Used only for iterating over dictionaries.
      // {iter} is each key, so {iter!} is the matching value
      inner_context[iter + '!'] = vals[i];  
    }
    pushRange(dest, expandContents(src));
  }
  popBuilderContext();
  popBuilderElement();
  
  return dest;
}

/**
 * Read an attribute of the <for> tag, looking for the iteration variable name.
 * @param src The <for> element
 * @param attr The attribute name
 * @returns A string, if found, or null if that attribute was not used.
 * @throws an error if the name is malformed - something other than a single word
 */
function getIterationVariable(src:Element, attr:string): string|null {
  const iter = src.getAttributeNS('', attr);
  if (!iter) {
    return null;
  }
  // Iteration variables need to be a single word. No punctuation.
  if (/^[a-zA-Z]+$/.test(iter)) {
    return iter;
  }
  throw new ContextError('For loop iteration variable must be a single word: ' + iter, elementSourceOffset(src, attr));
}

/**
 * Syntax: <for each="var" in="list">
 * @param src 
 * @param context 
 * @returns a list of elements
 */
function parseForEach(src:HTMLElement):any[] {
  const obj = evaluateAttribute(src, 'in', true);
  if (Array.isArray(obj)) {
    return obj as any[];
  }
  evaluateAttribute(src, 'in', true);  // Retry for debugging
  throw new ContextError("For each's in attribute must indicate a list", elementSourceOffseter(src, 'in'));
}

function parseForText(src:HTMLElement, delim:string):string[] {
  const tok = elementSourceOffset(src, 'in');
  const obj = evaluateAttribute(src, 'in', true);
  const str = makeString(obj, tok);
  if (delim == '') {  // When splitting every character, we still want to keep graphemes together
    return splitEmoji(str);
  }
  return str.split(delim);
}

function parseForRange(src:HTMLElement):any {
  const from = evaluateAttribute(src, 'from', true, false);
  const until = evaluateAttribute(src, 'until', true, false);
  const last = evaluateAttribute(src, 'to', true, false);
  const length = evaluateAttribute(src, 'len', true, false);
  const step = evaluateAttribute(src, 'step', true, false);

  const start = from ? makeInt(from, elementSourceOffseter(src, 'from')) : 0;
  let end = until ? makeInt(until, elementSourceOffseter(src, 'until'))
    : last ? (makeInt(last, elementSourceOffseter(src, 'last')) + 1)
    : length ? (makeString(length, elementSourceOffseter(src, 'len'))).length
    : start;
  const inc = step ? makeInt(step, elementSourceOffseter(src, 'step')) : 1;
  if (inc == 0) {
    throw new ContextError("Invalid loop step. Must be non-zero.", elementSourceOffseter(src, 'step'));
  }
  if (!until && inc < 0) {
    end -= 2;  // from 5 to 1 step -1 means i >= 0
  }

  const list:number[] = [];
  for (let i = start; inc > 0 ? (i < end) : (i > end); i += inc) {
    list.push(i);
  }
  return list;
}

function parseForKey(src:HTMLElement):any {
  const obj = evaluateAttribute(src, 'in', true);
  try {
    const keys = Object.keys(obj);
    const vals = keys.map(k => obj[k]);
    return [keys, vals];  
  }
  catch (ex) {
    throw new ContextError('Not an object with keys: ' + obj, elementSourceOffset(src, 'in'), ex);
  }
}

