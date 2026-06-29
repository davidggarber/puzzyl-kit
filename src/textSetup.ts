import { hasClass, toggleClass, applyAllClasses, getOptionalStyle, findParentOfClass, isTag, SortElements, isArrowKeyElement, moveFocus, ArrowKeyElement } from "./classUtil";
import { onLetterKeyDown, onLetterChange, onWordKey, onWordChange, onLetterKeyUp, onWordInput, onLetterInput, onButtonKeyDown, hasInputGroup, setCurrentInputGroup } from "./textInput";
import { indexAllInputFields } from "./storage"
import { cloneSomeAttributes } from "./builderContext";

/**
 * On page load, look for any instances of elements tag with class names we respond to.
 * When found, expand those elements appropriately.
 */
export function textSetup() {
    setupLetterPatterns();
    setupExtractedPatterns();
    setupLetterCells();
    setupLetterInputs();
    setupWordCells();
    setupCopyExtracters();
    indexAllInputFields();
}

/**
 * Look for elements of class 'create-from-pattern'.
 * When found, use the pattern, as well as other inputs, to build out a sequence of text inputs inside that element.
 * Secondary attributes:
 *   letter-cell-table: A table with this class will expect every cell
 *   data-letter-pattern: A string specifying the number of input, and any decorative text.
 *                        Example: "2-2-4" would create _ _ - _ _ - _ _ _ _
 *                        Special case: The character 'Â¤' is reserved for a solid block, like you might see in a crossword.
 *   data-extract-indeces: A string specifying which of these inputs should be auto-extracted.
 *                         The input indeces start at 1. To use more than one, separate by spaces.
 *                         Example: "1 8" would auto-extract the first and last characters from the above pattern.
 *   data-number-assignments: An alternate way of specifying which inputs to auto-extract.
 *                            Use this when the destination of the extracted characters is not in reading order.
 *                            Example: "1=4 8=5" would auto-extract the first and last characters from the above pattern,
 *                            and those characters would become the 4th and 5th characters in the extracted answer.
 *   data-input-style: Specifies the look of each input field (not those tagged for extraction).
 *                     Values implemented so far:
 *                     - underline (the default): renders each input as an underline, with padding between inputs
 *                     - box: renders each input as a box, with padding between inputs
 *                     - grid: renders each input as a box in a contiguous grid of boxes (no padding)
 *   data-literal-style: Specifies the look of characters that are mixed among the inputs (such as the dashes the in pattern above)
 *                       Values implemented so far:
 *                       - none (the default): no special decoration. The spacing will still stay even with inputs.
 *                       - box: renders each character in a box that is sized equal to a simple underline input.
 *   data-extract-style: Specifies the look of those input field that are tagged for extraction.
 *                       Values implemented so far:
 *                       - box: renders each input as a box, using the same spacing as underlines
 *   data-extract-image: Specifies an image to be rendered behind extractable inputs.
 *                       Example: "Icons/Circle.png" will render a circle behind the input, in addition to any other extract styles
 * 
 *   NOTE: the -style and -image fields can be placed on the affected pattern tag, or on any parent below the <BODY>.
 * 
 * ---- STYLES ----
 *   letter-grid-2d:       Simple arrow navigation in all directions. At left/right edges, wrap
 *   letter-grid-discover: Subtler arrow navigation, accounts for offsets by finding nearest likely target
 *   loop-navigation:      When set, arrowing off top or bottom loops around
 *   navigate-literals:    A table with this class will allow the cursor to land on literals, but not over-type them.
 */
function setupLetterPatterns() {
    const tables:HTMLCollectionOf<Element> = document.getElementsByClassName('letter-cell-table');
    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const navLiterals = findParentOfClass(table, 'navigate-literals') != null;
        const cells = table.getElementsByTagName('td');
        for (let j = 0; j < cells.length; j++) {
            const td = cells[j];
            // Skip cells with existing contents
            if (hasClass(td, 'no-cell')) {
                continue;
            }
            if (td.innerHTML == '') {
                toggleClass(td, 'create-from-pattern', true);
                if (!getOptionalStyle(td, 'data-letter-pattern')) {
                    td.setAttributeNS(null, 'data-letter-pattern', '1');
                }
                // Make sure every row that contains any cells with inputs is tagged as a block
                const tr = td.parentNode;
                toggleClass(tr, 'letter-cell-block', true);
                // Any cells tagged extract need to clarify what to extract
                if (hasClass(td, 'extract')) {
                    td.setAttributeNS(null, 'data-extract-indeces', '1');
                }
            }
            else {
                toggleClass(td, 'literal', true);
                // Any cells tagged extract need to clarify what to extract
                if (hasClass(td, 'extract')) {
                    toggleClass(td, 'extract-input', true);
                    toggleClass(td, 'extract-literal', true);
                    td.setAttributeNS(null, 'data-extract-value', td.innerText);
                }
                if (navLiterals) {
                    var span = document.createElement('span');
                    toggleClass(span, 'letter-cell', true);
                    toggleClass(span, 'literal', true);
                    toggleClass(span, 'read-only-overlay', true);
                    // Don't copy contents into span. Only used for cursor position
                    td.appendChild(span);
                }
            }
        }
    }
    
    const patterns:HTMLCollectionOf<Element> = document.getElementsByClassName('create-from-pattern');
    for (let i = 0; i < patterns.length; i++) {
        var parent = patterns[i];
        if (parent.id === 'extracted' || hasClass(parent, 'extracted')) {
            continue;  // This isn't an input pattern. It's a destination pattern
        }
        var pattern = parseNumberPattern(parent, 'data-letter-pattern');
        var extractPattern = parsePattern(parent, 'data-extract-indeces');
        var numberedPattern = parsePattern2(parent, 'data-number-assignments');
        var vertical = hasClass(parent, 'vertical');  // If set, each input and literal needs to be on a separate line
        var numeric = hasClass(parent, 'numeric');  // Forces inputs to be numeric
        var styles = getLetterStyles(parent, 'underline', 'none', 
            Object.keys(numberedPattern).length == 0 ? 'box' : 'numbered');

        if (pattern != null && pattern.length > 0) { //if (parent.classList.contains('letter-cell-block')) {
            var prevCount = 0;
            for (let pi = 0; pi < pattern.length; pi++) {
                if (pattern[pi]['count']) {
                    var count:number = pattern[pi]['count'] as number;
                    var word = document.createElement('span');
                    if (!vertical) {
                        toggleClass(word, 'letter-cell-set', true);  // usually, each number wants to be nobr
                    }
                    for (let ci = 1; ci <= count; ci++) {
                        var span = document.createElement('span');
                        toggleClass(span, 'letter-cell', true);
                        applyAllClasses(span, styles.letter);
                        toggleClass(span, 'numeric', numeric);
    
                        var index = prevCount + ci;
                        //Highlight and Extract patterns MUST be in ascending order
                        if (extractPattern.indexOf(index) >= 0) {
                            toggleClass(span, 'extract', true);
                            applyAllClasses(span, styles.extract);
                        }
                        if (numberedPattern[index] !== undefined) {
                            span.setAttributeNS('', 'data-extract-order', '' + numberedPattern[index]);
                            toggleClass(span, 'extract', true);
                            toggleClass(span, 'numbered', true);  // indicates numbers used in extraction
                            applyAllClasses(span, styles.extract);  // 'extract-numbered' indicates the visual appearance
                            var number = document.createElement('span');
                            toggleClass(number, 'under-number');
                            number.innerText = numberedPattern[index];
                            span.setAttribute('data-number', numberedPattern[index]);
                            span.appendChild(number);
                        }
                        word.appendChild(span);
                        if (vertical && (ci < count || pi < pattern.length - 1)) {
                            word.appendChild(document.createElement('br'));
                        }
                    }
                    parent.appendChild(word);
                    prevCount += count;
                }
                else if (pattern[pi]['char'] !== null) {
                    const lit = pattern[pi]['char'] as string
                    var span = createLetterLiteral(lit);
                    toggleClass(span, styles.literal, true);
                    parent.appendChild(span);
                    if (vertical && (pi < pattern.length - 1)) {
                        parent.appendChild(document.createElement('br'));
                    }
                }
            }
        }
    }
}

interface LetterStyles {
    letter: string;
    literal: string;
    extract: string;
    word: string;
    hidden: string;
}

/**
 * Look for the standard styles in the current tag, and all parents
 * @param elmt - A page element
 * @param defLetter - A default letter style
 * @param defLiteral - A default literal style
 * @param defExtract - A default extraction style
 * @returns An object with a style name for each role
 */
export function getLetterStyles(   elmt: Element, 
                            defLetter: string, 
                            defLiteral: string|undefined, 
                            defExtract: string)
                            : LetterStyles {
    let letter = getOptionalStyle(elmt, 'data-letter-style', undefined, 'letter-')
        || getOptionalStyle(elmt, 'data-input-style', defLetter, 'letter-');
    if (letter === 'letter-grid') {
        // Special case: grid overrides other defaults
        defLiteral = 'grid';
        defExtract = 'grid-highlight';
    }
    let literal = getOptionalStyle(elmt, 'data-literal-style', defLiteral);
    literal = (literal != null) ? ('literal-' + literal) : letter;
    let extract = getOptionalStyle(elmt, 'data-extract-style', defExtract, 'extract-');
    let word = getOptionalStyle(elmt, 'data-word-style', 'underline', 'word-');

    return {
        letter : letter as string,
        extract : extract as string,
        literal : literal as string,
        word: word as string,
        hidden: 'hide-element',
    };
}

/**
 * Create a span block for a literal character, which can be a sibling of text input fields.
 * It should occupy the same space, although may not have the same decorations such as underline.
 * The trick is to create an empty, disabled input (to hold the size), and then render plain text in front of it.
 * @param char - Literal text for a single character. Special case the paragraphs as <br>
 * @returns The generated <span> element
 */
function createLetterLiteral(char: string)
                            : HTMLElement {
    if (char == 'Â¶') {
        // Paragraph markers could be formatting, but just as likely are really spaces
        var br = document.createElement('br');
        br.classList.add('letter-input');
        br.classList.add('letter-non-input');
        br.setAttributeNS(null, 'data-literal', 'Â¶');
        return br;
    }
    var span = document.createElement('span');
    span.classList.add('letter-cell');
    span.classList.add('literal');
    initLiteralLetter(span, char);
    return span;
}

/**
 * Helper for createLetterLiteral
 * @param span - The span being created
 * @param char - A character to show. Spaces are converted to nbsp
 */
function initLiteralLetter( span: HTMLElement, 
                            char: string) {
    if (char == ' ') {
        span.innerText = '\xa0';
    }
    else if (char == 'Â¤') {
        span.innerText = '\xa0';
        span.classList.add('block');
    }
    else {
        span.innerText = char;
    }
}

/**
 * A token in a pattern of text input
 */
interface NumberPatternToken {
    char?: string;
    count?: number;
}

/**
 * Parse a pattern with numbers embedded in arbitrary text.
 * Each number can be multiple digits.
 * @example '$3.2' would return a list with 4 elements:
 *    {'type':'text', 'char':'$'}
 *    {'type':'number', 'count':'3'}
 *    {'type':'text', 'char':'.'}
 *    {'type':'number', 'count':'2'}
 * @param elmt - An element which may contain a pattern attribute 
 * @param patternAttr - The pattern attribute
 * @returns An array of pattern tokens
 */
function parseNumberPattern(elmt: Element, 
                            patternAttr: string)
                            : NumberPatternToken[] {
    const list:NumberPatternToken[] = [];
    const pattern = elmt.getAttributeNS('', patternAttr);
    if (pattern == null) {
        return list;
    }
    for (let pi = 0; pi < pattern.length; pi++) {
        let count = 0;
        while (pi < pattern.length && pattern[pi] >= '0' && pattern[pi] <= '9') {
            count = count * 10 + (pattern.charCodeAt(pi) - 48);
            pi++;
        }
        if (count > 0) {
            list.push({count: count as number});
        }
        if (pi < pattern.length) {
            if (pattern[pi] == '`' && pi + 1 < pattern.length) {
                pi++;  // The next character is escaped
            }
            list.push({char: pattern[pi]});
        }
    }
    return list;
}

/**
 * Parse a pattern with numbers separated by spaces.
 * @example '12 3' would return a list with 2 elements: [12, 3]
 * If offset is specified, each number is shifted accordingly
 * @example '12 3' with offset -1 would return a list : [11, 2]
 * @param elmt - An element which may contain a pattern attribute 
 * @param patternAttr - The pattern attribute
 * @param offset - (optional) An offset to apply to each number
 * @returns An array of numbers
 */
function parsePattern(  elmt: Element, 
                        patternAttr: string, 
                        offset: number = 0)
                        : number[] {
    var pattern = elmt.getAttributeNS('', patternAttr);
    offset = offset || 0;
    const set:number[] = [];
    if (pattern != null)
    {
        var array = pattern.split(' ');
        for(let i:number = 0; i < array.length; i++){
            set.push(parseInt(array[i]) + offset);
        }
    }
    return set;
}

/**
 * Parse a pattern with assignments separated by spaces.
 * Each assignment is in turn a number and a value, separated by an equal sign.
 * @example '2=abc 34=5' would return a dictionary with 2 elements: {'2':'abc', '34':'5'}
 * If offset is specified, each key number is shifted accordingly. But values are not shifted.
 * @example '2=abc 34=5' with offset -1 would return {'1':'abc', '34':'5'}
 * @param elmt - An element which may contain a pattern attribute 
 * @param patternAttr - The pattern attribute
 * @param offset - (optional) An offset to apply to each number
 * @returns A generic object of names and values
 */
function parsePattern2( elmt: Element, 
                        patternAttr: string, 
                        offset: number = 0)
                        : Record<number, string> {
    var pattern = elmt.getAttributeNS('', patternAttr);
    offset = offset || 0;
    var set: Record<number, string> = {};
    if (pattern != null)
    {
        var array = pattern.split(' ');
        for(let i:number = 0; i < array.length; i++){
            var equals = array[i].split('=');
            set[parseInt(equals[0]) + offset] = equals[1];
        }
    }
    return set;
}

// Attributes that authors can place on <letter/> elements
// which we should mirror to the underlying input fields
const inputAttributesToCopy = [ 'size', 'maxlength', 'inputmode' ];

/**
 * Once elements are created and tagged with letter-cell,
 * (which happens automatically when containers are tagged with create-from-pattern)
 * add input areas inside each cell.
 * If the cell is tagged for extraction, or numbering, add appropriate tags and other child nodes.
 * @example <div class="letter-cell"/> becomes:
 *   <div><input type='text' class="letter-input" /></div>  // for simple text input
 * If the cell had other attributes, those are either mirrored to the text input,
 * or trigger secondary attributes.
 * For example, letter-cells that also have class:
 *   "numeric" - format the input for numbers only
 *   "numbered" - label that cell for re-ordered extraction to a final answer
 *   "extract" - format that cell for in-order extraction to a final answer
 *   "extractor" - format that cell as the destination of extraction
 *   "literal" - format that cell as read-only, and overlay the literal text or whitespace
 */
function setupLetterCells() {
    const allCells = document.getElementsByClassName('letter-cell');
    const cells = SortElements(allCells);
    let extracteeIndex:number = 1;
    let extractorIndex:number = 1;
    for (let i = 0; i < cells.length; i++) {
        const cell:HTMLElement = cells[i] as HTMLElement;
        const navLiterals = findParentOfClass(cell, 'navigate-literals') != null;

        // Letters can specify under-numbers, separate from extraction patterns.
        // This enables copy-id, or other hinting.
        const underNum = cell.getAttributeNS('', 'under-text');
        if (underNum) {
            // under-text spans go before the <input>
            const under = document.createElement('span');
            toggleClass(under, 'under-number');
            under.innerText = underNum;
            cell.appendChild(under);
        }

        // Place a small text input field in each cell
        const inp:HTMLInputElement = document.createElement('input');
        inp.type = 'text';
        cloneSomeAttributes(cell, inp, inputAttributesToCopy);

        // Allow container to inject ID
        let attr:string|null;
        if (attr = cell.getAttributeNS('', 'input-id')) {
            inp.id = attr;
        }     

        if (hasClass(cell, 'numeric')) {
            // We never submit, so this doesn't have to be exact. But it should trigger the mobile numeric keyboard
            inp.pattern = '[0-9]*';  // iOS
            inp.inputMode = 'numeric';  // Android
        }
        toggleClass(inp, 'letter-input');
        if (hasClass(cell, 'extract')) {
            toggleClass(inp, 'extract-input');
            var extractImg = getOptionalStyle(cell, 'data-extract-image');
            if (extractImg != null) {
                var img = document.createElement('img');
                img.src = extractImg;
                img.classList.add('extract-image');
                cell.appendChild(img);
            }
        
            if (hasClass(cell, 'numbered')) {
                toggleClass(inp, 'numbered-input');
                const dataNumber = cell.getAttribute('data-number');
                if (dataNumber != null) {
                    inp.setAttribute('data-number', dataNumber);
                }
            }
            else {
                // Implicit number based on reading order
                inp.setAttribute('data-number', "" + extracteeIndex++);
            }
        }
        if (hasClass(cell, 'extractor')) {
            toggleClass(inp, 'extractor-input');
            inp.id = 'extractor-' + extractorIndex++;
        }

        if (hasClass(cell, 'literal')) {
            toggleClass(inp, 'letter-non-input');
            const val = cell.innerText;
            cell.innerHTML = '';

            inp.setAttribute('data-literal', val == '\xa0' ? ' ' : val);
            if (navLiterals) {
                inp.setAttribute('readonly', '');
                inp.value = val;
            }
            else {
                inp.setAttribute('disabled', '');
                var span = document.createElement('span');
                toggleClass(span, 'letter-literal');
                span.innerText = val;
                cell.appendChild(span);        
            }
        }
        cell.appendChild(inp);
    }
}

/**
 * Every input tagged as a letter-input should be hooked up to our all-purpose text input handler
 * @example, each <input type="text" class="letter-input" />
 *   has keyup/down/change event handlers added.
 */
function setupLetterInputs() {
    var inputs = document.getElementsByClassName('letter-input');
    for (let i = 0; i < inputs.length; i++) {
        const inp:HTMLInputElement = inputs[i] as HTMLInputElement;
        inp.onkeydown=function(e){onLetterKeyDown(e)};
        inp.onkeyup=function(e){onLetterKeyUp(e)};
        inp.onchange=function(e){onLetterChange(e as KeyboardEvent)};
        inp.oninput=function(e){onLetterInput(e as InputEvent)};
    }

    // Buttons get caught up in the arrow navigation of input fields,
    // so make sure players can arrow back out.
    var buttons = document.getElementsByTagName('button');
    for (let i = 0; i < buttons.length; i++) {
        const btn:HTMLButtonElement = buttons[i] as HTMLButtonElement;
        btn.onkeydown=function(e){onButtonKeyDown(e)};
        // btn.onkeyup=function(e){onLetterKeyUp(e)};
    }
}

/**
 * Once elements are created and tagged with word-cell, add input areas inside each cell.
 * @example <div class="word-cell"/> becomes:
 *   <div><input type='text' class="word-input" /></div>  // for simple multi-letter text input
 */
function setupWordCells() {
    var cells = document.getElementsByClassName('word-cell');
    for (let i = 0; i < cells.length; i++) {
        const cell:HTMLElement = cells[i] as HTMLElement;
        let inpStyle = getOptionalStyle(cell, 'data-word-style', 'underline', 'word-');

        // Place a text input field in each cell
        const inp:HTMLInputElement = document.createElement('input');
        inp.type = 'text';
        toggleClass(inp, 'word-input');
        cloneSomeAttributes(cell, inp, inputAttributesToCopy);

        // Allow container to inject ID
        let attr:string|null;
        if (attr = cell.getAttributeNS('', 'input-id')) {
            inp.id = attr;
        }     

        if (hasClass(cell, 'literal')) {
            inp.setAttribute('disabled', '');
            toggleClass(inp, 'word-literal');
            // var span:HTMLElement = document.createElement('span');
            // toggleClass(span, 'word-literal');
            inp.value = cell.innerText;
            cell.innerHTML = '';
            // cell.appendChild(span);
            inpStyle = getOptionalStyle(cell, 'data-literal-style', undefined, 'word-') || inpStyle;
        }
        else {
            inp.onkeydown=function(e){onLetterKeyDown(e)};
            inp.onkeyup=function(e){onWordKey(e)};
            inp.onchange=function(e){onWordChange(e as KeyboardEvent)};
            inp.oninput=function(e){onWordInput(e as InputEvent)};

            if (hasClass(cell, 'numeric')) {
                // We never submit, so this doesn't have to be exact. But it should trigger the mobile numeric keyboard
                inp.pattern = '[0-9]*';  // iOS
                inp.inputMode = 'numeric';  // Android
            }
        }

        cell.appendChild(inp);

        const extractIndex = cell.getAttributeNS('', 'data-extract-index')
        if (extractIndex !== null) {
            const index = document.createElement('span');
            toggleClass(index, 'letter-index');
            index.innerText = extractIndex;

            let indexStyle = getOptionalStyle(cell, 'data-index-style', 'none', 'index-');
            if (indexStyle) {
                applyAllClasses(index, indexStyle);
            }
            
            cell.appendChild(index);
        }
    }
}

/**
 * Among the patterns (class='create-from-pattern'), process those tagged as
 * extraction destinations. Either id="extracted" or class="extracted".
 * 
 * @todo: clarify the difference between "extracted" and "extractor"
 */
function setupExtractedPatterns() {
    var patterns:HTMLCollectionOf<Element> = document.getElementsByClassName('create-from-pattern');
    for (let pat of Array.from(patterns)) {
        if (pat.id === 'extracted' || hasClass(pat, 'extracted')) {
            setupExtractPattern(pat);
        }
    }
}

/**
 * Evaluate one area tagged as an extract destination.
 * The area may be further annotated with data-numbered-pattern="..." 
 * and optionally data-indexed-by-letter="true" to create sequences of 
 * numbered/lettered destination points.
 * 
 * Several styles: 
 *   + un-numbered blanks, with optional literals
 *   + numbered blanks
 *   + lettered blanks (handy variant, when data itself is numeric)
 * 
 * NOTE: Don't use patterns for the other extracted styles:
 *   + initially hidden, converting to blanks once extraction starts
 *   + initially hidden, converting to simple letters once extraction starts
 * 
 * @param extracted The container for the extraction.
 */
function setupExtractPattern(extracted:Element) {
    if (extracted === null) {
        return;
    }

    // All three variants use the same syntax (length list)
    let patternAttr = 'data-letter-pattern';  // If user uses input-style syntax
    let numbered:boolean = false;
    let lettered:boolean = false;
    if (extracted.hasAttributeNS('', 'data-extract-numbered')) {
        numbered = true;
        patternAttr = 'data-extract-numbered';
    }
    else if (extracted.hasAttributeNS('', 'data-extract-lettered')) {
        numbered = lettered = true;
        patternAttr = 'data-extract-lettered';
    }
    else if (extracted.hasAttributeNS('', 'data-extracted-pattern')) {
        patternAttr = 'data-extracted-pattern';
    }
    
    var styles = getLetterStyles(extracted, 'underline', 'none', '');

    let numPattern = parseNumberPattern(extracted, patternAttr);
    var nextNumber = 1;
    for (let pi = 0; pi < numPattern.length; pi++) {
        if (numPattern[pi]['count']) {
            var count = numPattern[pi]['count'] as number;
            for (let ci = 1; ci <= count; ci++) {
                const span:HTMLSpanElement = document.createElement('span');
                toggleClass(span, 'letter-cell', true);
                toggleClass(span, 'extractor', true);
                applyAllClasses(span, styles.letter);  // letter-style, not extract-style
                extracted.appendChild(span);
                if (numbered) {
                    toggleClass(span, 'numbered');
                    const number:HTMLSpanElement = document.createElement('span');
                    toggleClass(number, 'under-number');
                    number.innerText = lettered ? String.fromCharCode(64 + nextNumber) : ("" + nextNumber);
                    span.setAttribute('data-number', "" + nextNumber);
                    span.appendChild(number);
                    nextNumber++;
                }
            }
        }
        else if (numPattern[pi]['char'] !== null) {
            var span = createLetterLiteral(numPattern[pi]['char'] as string);
            applyAllClasses(span, styles.literal);
            extracted.appendChild(span);
        }
    }
}

/**
 * An alternative to pushed extractions is pulled "copy" extractions.
 * At setup time, we need to identify any source elements, so they know to extract.
 * All such elements will have the class copy-extractee. 
 * The destinations already have the class copy-extracter.
 * 
 * Any element of class copy-extracter should also have a data-copy-id attribute.
 * That attribute contains the ID, and possible modifiers, of another input that we will copy from.
 * It can also contain multiple such IDs, separated by spaces.
 * Each ID should have the format: <id>[.index][.sub-index], where
 *   - id is the ID of the source element (or at least its letter-/word-cell parent)
 *   - index, if present is the character index (ignoring whitespace) of any multi-letter inputs. 
 *     If omitted, copy the entire contents of the source input.
 *   - sub-index, if present, converts index to a word index (1-based), 
 *     and the sub-index is the character index within the word.
 */
function setupCopyExtracters() {
    const elmts = document.getElementsByClassName('copy-extracter');
    for (let i = 0; i < elmts.length; i++) {
        const elmt:HTMLElement = elmts[i] as HTMLElement;
        const copyId = elmt.getAttribute('data-copy-id');
        if (copyId) {
            const copyIds = copyId.split(' ');
            for (let c = 0; c < copyIds.length; c++) {
                const srcId = copyIds[c].split('.')[0];
                const src = document.getElementById(srcId);
                if (src) {
                    toggleClass(src, 'copy-extractee', true);
                }
            }
        }
    }
}

/**
 * Has the user started inputing an answer?
 * @param event - Any user action that led here
 * @returns true if any letter-input or word-input fields have user values
 */
function hasProgress(event: Event): boolean {
    let inputs = document.getElementsByClassName('letter-input');
    for (let i = 0; i < inputs.length; i++) {
        const inp:HTMLInputElement = inputs[i] as HTMLInputElement;
        if (inp.value != '') {
            return true;
        }
    }
    inputs = document.getElementsByClassName('word-input');
    for (let i = 0; i < inputs.length; i++) {
        const inp:HTMLInputElement = inputs[i] as HTMLInputElement;
        if (inp.value != '') {
            return true;
        }
    }
    return false;
}

/**
 * Setup a click handler on the page to help sloppy clickers find inputs
 * @param page 
 */
export function clicksFindInputs(page:HTMLDivElement) {
    page.addEventListener('pointerdown', function (e) { startSloppyClick(e); } );
    page.addEventListener('pointerup', function (e) { endSloppyClick(e); } );
    page.addEventListener('pointerleave', function () { cancelSloppyClick(); } );
}

let _sloppyTargets:Element[]|null = null;
let _sloppyCaret:Range|null = null;
let _sloppyPrevDown:number = 0;

function startSloppyClick(evt:PointerEvent) {
    _sloppyTargets = document.elementsFromPoint(evt.clientX, evt.clientY);
    if (document.caretRangeFromPoint) {
        _sloppyCaret = document.caretRangeFromPoint(evt.clientX, evt.clientY);
    }
    const now = Date.now();
    if ((now - _sloppyPrevDown) < 300) {
        cancelSloppyClick();  // Double-clicks are disqualified
    };
    _sloppyPrevDown = now;
}

function endSloppyClick(evt:PointerEvent) {
    if (_sloppyTargets) {
        const targets = document.elementsFromPoint(evt.clientX, evt.clientY);
        let match = targets.length == _sloppyTargets.length;
        if (match) {
            for (let i = 0; i < targets.length; i++) {
                if (targets[i] != _sloppyTargets[i]) {
                    match = false;
                    break;
                }
            }
        }
        if (match) {
            if (!document.caretRangeFromPoint) {
                focusNearestInput(evt);
            }
            else {
                const caret = document.caretRangeFromPoint(evt.clientX, evt.clientY);
                if (isSameCaret(_sloppyCaret, caret)) {
                    focusNearestInput(evt);
                }
            }
        }
    }
    cancelSloppyClick();
}

function cancelSloppyClick() {
    _sloppyTargets = null;
    _sloppyCaret = null;
}

function isSameCaret(a:Range|null, b:Range|null):boolean {
    if (!a && !b) {
        return true;
    }
    if (!a || !b) {
        return false;
    }
    if (a.startContainer != a.endContainer || a.startContainer != b.startContainer || b.startContainer != b.endContainer) {
        return false;
    }
    return a.startOffset == a.endOffset && b.startOffset == b.endOffset && a.startOffset == b.startOffset;
}

/**
 * Move the focus to the nearest input-appropriate element.
 * @param evt A mouse event
 */
function focusNearestInput(evt:PointerEvent) {
    // Ignore shift states
    // Ignore fake events (!isTrusted)
    if (!evt.ctrlKey && !evt.shiftKey && !evt.altKey && evt.isTrusted) {
        const targets = document.elementsFromPoint(evt.clientX, evt.clientY);
        let nearest:HTMLElement|undefined = undefined;

        for (let i = 0; i < targets.length; i++) {
            const target = targets[i] as HTMLElement;
            if ((target.getAttribute('disabled') === null) && (isArrowKeyElement(target) || isTag(target, 'a'))) {
                nearest = target;  // Shouldn't need my help
                break;
            }
            if (findParentOfClass(target, 'word-select-area') || findParentOfClass(target, 'straight-edge-area')
                 || findParentOfClass(target, 'hashi-bridge-area')
                 || findParentOfClass(target, 'moveable') || findParentOfClass(target, 'drop-target')) {
                return;  // Drag affect regions
            }
            if (hasClass(target, 'stampTool') || hasClass(target, 'stampLock')
                || findParentOfClass(target, 'stampable') || findParentOfClass(target, 'cross-off')) {
                return;  // Stamping elements don't handle their own clicks; the page does
            }
            if (target.id == 'page' || target.id == 'scratch-pad' || hasClass(target as Node, 'scratch-div')) {
                break;  // Found none. Continue below
            }
            if (hasClass(target, 'clickable') || target.id.indexOf('-toggle') >= 0) {
                // Example: #decoder-toggle
                return;  // Target has its own handler
            }
        }

        let nearestD:number = NaN;
        if (nearest) {
            nearestD = 0;
        }
        else {
            const tags = ['input', 'textarea', 'select', 'a', 'clickable', 'stampable'];

            for (let t = 0; t < tags.length; t++) {
                const elements = tags[t] === 'clickable' ? document.getElementsByClassName(tags[t])
                    : document.getElementsByTagName(tags[t]);
                for (let i = 0; i < elements.length; i++) {
                    const elmt = elements[i] as HTMLElement;
                    if (elmt.style.display !== 'none' && elmt.getAttribute('disabled') === null) {
                        const d = distanceToElement(evt, elmt);
                        if (Number.isNaN(nearestD) || d < nearestD) {
                            nearest = elmt;
                            nearestD = d;
                        }
                    }
                }
            }
        }

        if (nearest) {
            if (isTag(nearest, 'a') && nearestD < 50) {  // 1/2 inch max
                nearest.click();
            }
            else if (hasClass(nearest, 'clickable')) {
                if (hasInputGroup(nearest)) {
                    setCurrentInputGroup(nearest as ArrowKeyElement);
                }
                nearest.click();
            }
            else {
                moveFocus(nearest);
            }
        }
    }

}

/**
 * Distance between a mouse event and the nearest edge or corner of an element
 * @param evt A mouse event
 * @param elmt A rectangular element
 * @returns A distance in client pixels
 */
function distanceToElement(evt:MouseEvent, elmt:HTMLElement):number {
    const rect = elmt.getBoundingClientRect();
    if (evt.clientX < rect.left) {
        if (evt.clientY < rect.top) {
            return distanceP2P(evt.clientX, evt.clientY, rect.left, rect.top);
        }
        if (evt.clientY < rect.bottom) {
            return distanceP2P(evt.clientX, evt.clientY, rect.left, evt.clientY);
        }
        return distanceP2P(evt.clientX, evt.clientY, rect.left, rect.bottom);
    }
    if (evt.clientX > rect.right) {
        if (evt.clientY < rect.top) {
            return distanceP2P(evt.clientX, evt.clientY, rect.right, rect.top);
        }
        if (evt.clientY < rect.bottom) {
            return distanceP2P(evt.clientX, evt.clientY, rect.right, evt.clientY);
        }
        return distanceP2P(evt.clientX, evt.clientY, rect.right, rect.bottom);
    }
    if (evt.clientY < rect.top) {
        return distanceP2P(evt.clientX, evt.clientY, evt.clientX, rect.top);
    }
    if (evt.clientY < rect.bottom) {
        return 0;
    }
    return distanceP2P(evt.clientX, evt.clientY, evt.clientX, rect.bottom);
}

/**
 * Pythagorean distance, but favor X more than Y
 * @returns A distance in client pixels
 */
function distanceP2P(x1:number, y1:number, x2:number, y2:number):number {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) * 3);
}