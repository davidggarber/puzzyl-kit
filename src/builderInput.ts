import { appendRange, consoleComment, expandContents, normalizeName } from "./builder";
import { cloneAttributes, cloneText } from "./builderContext";
import { applyAllClasses, getOptionalStyle, isTag, toggleClass } from "./classUtil";
import { ContextError, debugTagAttrs, traceTagComment, elementSourceOffset, nodeSourceOffset, SourceOffset } from "./contextError";
import { getLetterStyles } from "./textSetup";

export const inputAreaTagNames = [
  'letter', 'letters', 'literal', 'number', 'numbers', 'pattern', 'word', 'extract'
];

type SpecialCaseFunction = (attr:string,span:HTMLSpanElement) => void;

type InputAttributeConversion = {
  inherit?: string,        // If present, this conversion extends the named set of conversion rules
  spanRename?: Record<string, string>,     // If any key attribute is present, rename it to the value attribute on the span
  spanClass?: Record<string, string>,      // If any key attribute is present, apply the value as a class on the span
  optionalStyle?: Record<string, string>   // If any key attribute is present, apply one of the optional data styles. First one wins
  specialCases?: Record<string, SpecialCaseFunction>    // If any key attribute is present, call the value as a SpecialCaseFunction
  required?: string,       // If any attribute is required
}
// Note that the same input attribute can be a key in multiple conversion fields.
// For example, it could trigger a spanClass, and also an optional style,
// and also get renamed or special cased. The last two should not coexit.
// Separate from anything keyed explicitly, anything else copies verbatim.

const inputAttributeConversions: Record<string, InputAttributeConversion> = {
  '': {
    // span: {},   // dead code?
    // input: {}
  },
  letter: {
    inherit: '',
    spanClass: {
      '': 'letter-cell',
      block: 'block',
      literal: 'literal',
      extract: 'extract',
      'copy-id': 'copy-extracter',
    },
    spanRename: {
      'extracted-id': 'data-extracted-id', // Destination of extraction
      'copy-id': 'data-copy-id', // Source of extraction
    },
    optionalStyle: {
      '': 'letter',
      literal: 'literal',
      extract: 'extract'   
    },
    specialCases: {
      extract: underNumberExtracts,  // extracted letter
      literal: specialLiterals,      // literal, read-only
      block: specialLiterals,        // this letter will extract (if a number, then under-numbered)
    }
  },
  letters: {
    inherit: 'letter',
    spanClass: {
      '': 'multiple-letter',  // A few letters, squeezed together
    }
  },
  number: {
    inherit: 'letter',
    spanClass: {
      '': 'numeric',  // Constrain input to decimal digits (or - or .)
    }
  },
  numbers: {
    inherit: 'number',
    spanClass: {
      '': 'multiple-letter',  // Same as letters, but just numbers
    }
  },
  literal: {
    inherit: 'letter',
    spanClass: {
      '': 'literal'
    },
    optionalStyle: {
      '': 'literal',
    },
    specialCases: {
      '': specialLiterals,      // process the inner text
      'block': specialLiterals, // literal rendered as a dark block
    }
  },

  word: {
    inherit: '',
    spanClass: {
      '': 'word-cell',
      literal: 'literal',
      'copy-id': 'copy-extracter',
      // TODO: numbers (destination)
    },
    spanRename: {
      extract: 'data-extract-index',       // Either letter index, or word.letter index
      'extracted-id': 'data-extracted-id', // Destination of extraction
      'copy-id': 'data-copy-id', // Source of extraction
    },
    specialCases: {
      literal: specialLiterals,
      block: specialLiterals,
    },
    optionalStyle: {
      '': 'word',
    }
  },

  pattern: {
    inherit: '',
    spanClass: {
      '': 'letter-cell-block',
      pattern: 'create-from-pattern',
      extracted:          'create-from-pattern extracted',
      'extract-numbered': 'create-from-pattern extracted',
      'extract-lettered': 'create-from-pattern extracted',
    },
    spanRename: {
      pattern: 'data-letter-pattern',       // A length list
      extract: 'data-extract-indeces',      // An index list of extract indeces
      numbers: 'data-number-assignments',   // A list of index=number pairs
      'extracted-id': 'data-extracted-id',  // Destination of extraction
    // Extracted cases
      extracted: 'data-extracted-pattern',        // same as pattern, but as the extracted target
      'extract-numbered': 'data-extract-numbered',  // each letter is given an under-number
      'extract-lettered': 'data-extract-lettered',  // same as numbered, but under-numbers are alphabetic
    },
  },

  extract: {
    inherit: '',
    spanClass: {
      '': 'extract-literal',
      word: 'word-input',
      letter: 'extract-input',
      letters: 'extract-input',
    },
    spanRename: {
      word: 'value',
      letter: 'value',
      letters: 'value',
      'copy-id': 'data-copy-id', // Source of extraction
    },
    optionalStyle: {
      '': 'hidden',
    }
  },
};

/**
 * If a <letter> has an extract attribute, check if its value is numeric.
 * If so, set up the under-number.
 * @param extract The value of the extract attribute
 * @param span The span that  will contain an input
 */
function underNumberExtracts(extract:string, span:HTMLSpanElement) {
  if (parseInt(extract) > 0) {
    toggleClass(span, 'numbered', true);
    toggleClass(span, 'extract-numbered', true);
    span.setAttributeNS('', 'data-number', extract);
    
    const under = document.createElement('span');
    toggleClass(under, 'under-number');
    under.innerText = extract;
    span.appendChild(under);
  }
}

function specialLiterals(literal:string, span:HTMLSpanElement) {
  if (literal === '¤') {
    toggleClass(span, 'block', true);
    literal = ' ';
  }
  span.appendChild(document.createTextNode(literal));
}

export function startInputArea(src:HTMLElement):Node[] {
  const span = document.createElement('span');
  traceTagComment(src, span, true);

  // Copy most attributes. 
  // Special-cased ones are harmless - no meaning in generic spans
  cloneAttributes(src, span);

  let optionalStyleSet:string|undefined = undefined;
  let conversion:InputAttributeConversion|undefined = inputAttributeConversions[src.localName.toLowerCase()];
  while (conversion) {
    // Apply any classes to the span
    if (conversion.spanClass) {
      if (conversion.spanClass['']) {
        applyAllClasses(span, conversion.spanClass['']);
      }
      const keys = Object.keys(conversion.spanClass);
      for (let i = 0; i < keys.length; i++) {
        if (src.getAttributeNS('', keys[i]) !== null) {
          applyAllClasses(span, conversion.spanClass[keys[i]]);
        }
      }
    }
    // Which group of optional styles should be applied. First one wins.
    if (conversion.optionalStyle && !optionalStyleSet) {
      const keys = Object.keys(conversion.optionalStyle);
      for (let i = 0; i < keys.length; i++) {
        if (src.getAttributeNS('', keys[i]) !== null) {
          optionalStyleSet = conversion.optionalStyle[keys[i]];
          break;
        }
      }
      if (!optionalStyleSet && '' in conversion.optionalStyle) {
        optionalStyleSet = conversion.optionalStyle[''] as string;
      }
    }
    // Rename some attributes
    if (conversion.spanRename) {
      const keys = Object.keys(conversion.spanRename);
      for (let i = 0; i < keys.length; i++) {
        const attr = src.getAttributeNS('', keys[i]);
        if (attr !== null) {
          span.setAttributeNS('', conversion.spanRename[keys[i]], cloneText(attr, false));
        }
      }
    }
    // Some attributes need custom handling
    if (conversion.specialCases) {
      const keys = Object.keys(conversion.specialCases);
      for (let i = 0; i < keys.length; i++) {
        const attr = src.getAttributeNS('', keys[i]);
        if (attr !== null) {
          const func:SpecialCaseFunction = conversion.specialCases[keys[i]] as SpecialCaseFunction;
          func(cloneText(attr, false), span);
        }
      }
      if ('' in conversion.specialCases && src.innerText.length > 0) {
        // Special case any innerText
        const func:SpecialCaseFunction = conversion.specialCases[''] as SpecialCaseFunction;
        func(cloneText(src.innerText, true), span);
      }
    }

    // Repeat with any additional inherited rules
    conversion = conversion.inherit ? inputAttributeConversions[conversion.inherit] : undefined;
  }

  if (optionalStyleSet) {
    // This tag accepts one of the groups of optional styles
    let styles = getLetterStyles(src, 'underline', 'none', 'box');
    applyAllClasses(span, (styles as any)[optionalStyleSet]);
  }

  if (src.localName !== 'literal' && src.childNodes.length > 0) {
    throw new ContextError('Input tags like <' + src.localName + '/> should be empty elements', nodeSourceOffset(src.childNodes[0]));
  }

  return [span];
}


