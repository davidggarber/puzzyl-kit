import { isTag, hasClass, getOptionalStyle,
    findParentOfClass, findFirstChildOfClass, findNextOfClass, 
    findInNextContainer, findEndInContainer,
    moveFocus, toggleClass, SortElements, 
    TextInputElement, ArrowKeyElement, isTextInputElement,
    isArrowKeyElement,
    removeClassGlobally,
    getAllElementsWithAttribute} from "./classUtil";
import { toggleHighlight } from "./notes";
import { isDebug, isTrace, theBoiler } from "./boilerplate";
import { saveLetterLocally, saveWordLocally } from "./storage";
import { validateInputReady } from "./confirmation";
import { getParentIf, splitEmoji } from "./builder";

/**
 * Any event stemming from key in this list should be ignored
 */
const ignoreKeys:string[] = [
    'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'OptionLeft', 'OptionRight', 'CapsLock', 'Backspace', 'Escape', 'Delete', 'Insert', 'NumLock', 'ScrollLock', 'Pause', 'PrintScreen',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16',
]

/**
 * The names of the back and forward arrow keys.
 * If RTL, swap these
 */
var ArrowPrior = 'ArrowLeft';
var ArrowNext = 'ArrowRight';
/**
 * The change in horizontal index that happens after a right arrow
 * If RTL, this should be -1
 */
var plusX = 1;

/**
 * todo: DOCUMENT THIS
 */
var priorInputValue = '';
/**
 * The input 
 */
let keyDownTarget:ArrowKeyElement|null = null;

/**
 * The name of the currently highlighted input group
 */
let inputGroupElement:ArrowKeyElement|null = null;
let currentInputGroup:string|null = null;

/**
 * Workaround for keydown/up on mobile
 */
let keyDownUnidentified:boolean = true;

export function onInputEvent(event: KeyboardEvent) {
    console.log(event);
}

/**
 * Callback when a user pressed a keyboard key from any letter-input or word-input text field
 * @param event - A keyboard event
 */
export function onLetterKeyDown(event: KeyboardEvent) {
    keyDownUnidentified = event.which == 229;
    var input = event.currentTarget as TextInputElement;
    keyDownTarget = input;
    priorInputValue = input.value;

    var code = event.code;
    if (code == undefined || code == '') {
        code = event.key;  // Mobile doesn't use code
    }

    var inpClass = hasClass(input, 'word-input') ? 'word-input' : 'letter-input';
    let skipClass:string|undefined;
    if (!findParentOfClass(input, 'navigate-literals')) {
        skipClass = hasClass(input, 'word-input') ? 'word-non-input' : 'letter-non-input';
    }

    let prior:TextInputElement|null = null;

    if (hasClass(input.parentNode as Element, 'multiple-letter') || hasClass(input, 'word-input')) {
        // Multi-character fields still want the ability to arrow between cells.
        // We need to look at the selection prior to the arrow's effect, 
        // to see if we're already at the edge.
        if ((code == 'Enter' || code == 'NumpadEnter') && getOptionalStyle(input, 'data-show-ready')) {
            // Don't move to next field
        }
        else if (code == ArrowNext || code == 'Enter') {
            var s = input.selectionStart;
            var e = input.selectionEnd;
            if (s == e && e == input.value.length) {
                const next = findNextGroupInput(input, true, true, inpClass)
                            || findNextInput(input, plusX, 0, inpClass, skipClass);
                if (next != null) {
                    moveFocus(next, 0);
                }
                event.preventDefault();
            }
        }
        else if (code == ArrowPrior) {
            var s = input.selectionStart;
            var e = input.selectionEnd;
            if (s == e && e == 0) {
                const prior = findNextGroupInput(input, false, true, inpClass)
                            || findNextInput(input, -plusX, 0, inpClass, skipClass);
                if (prior != null) {
                    moveFocus(prior, prior.value.length);
                }
                event.preventDefault();
            }
        }
    }
    else {
        if (code == 'Backspace' || code == 'Space') {
            spaceOverNextInput(input, code);
            event.preventDefault();
            return;    
        }

        if (event.key.length == 1) {
            if (event.key == '`') {
                toggleHighlight(input);
            }
            else if (matchInputRules(input, event)) {
                input.value = event.key;
                afterInputUpdate(input, event.key);
                event.preventDefault();
                return;
            }
        }

        // Single-character fields always go to the next field
        if (processArrowKeys(input, event)) {
            return;
        }
    }

    if (processArrowKeys(input, event, true)) {
        return;
    }

    // if (code == 'CapsLock') {
    //     // CapsLock toggles directions
    //     setCurrentInputGroup(input);
    //     return;
    // }

    if (findParentOfClass(input, 'digit-only')) {
        if (event.key.length == 1 && !event.ctrlKey && !event.altKey
            && (event.key >= 'A' && event.key < 'Z' || event.key > 'a' && event.key < 'z')) {
            // Completely disallow (English) alpha characters. Punctuation still ok.
            event.preventDefault();
        }
    }
}

/**
 * Callback when a user pressed a keyboard key from any letter-input or word-input text field
 * @param event - A keyboard event
 */
export function onButtonKeyDown(event: KeyboardEvent) {
    var current = event.currentTarget as ArrowKeyElement;
    if (processArrowKeys(current, event)) {
        keyDownTarget = current;
    }
}

const arrowKeyCodes = [
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End', 'PageUp', 'PageDown'
];

/**
 * Is this key an arrow key?
 * @param code A key code
 * @returns True, if any of the usual arrow keys
 */
function isArrowKey(code:string) {
    return arrowKeyCodes.indexOf(code) >= 0;
}

/**
 * Standard handlers for arrow keys and similar: home/end, page-up/down,
 * including ctrl+ variants.
 * @param start Element that currently has the keyboard focused
 * @param event The key event that *might* be an arrow key
 * @param verticalOnly If set, only up/down keys are considered, else left/right keys are too (default).
 * @returns true if the arrow key was processed, and the focus moved.
 * False if any other key.
 */
function processArrowKeys(start:ArrowKeyElement, event:KeyboardEvent, verticalOnly:boolean = false):boolean {
    var code = event.code;
    if (code == undefined || code == '') {
        code = event.key;  // Mobile doesn't use code
    }

    if (arrowFromInputGroup(start, code)) {
        event.preventDefault();  // Don't cause cursor movement within the cell
        return true;
    }

    var inpClass = 'word-input letter-input';
    let skipClass:string|undefined;
    if (!findParentOfClass(start, 'navigate-literals')) {
        skipClass = 'word-non-input letter-non-input';
    }

    // Consider vertical movement keys
    if (code == 'ArrowUp' || code == 'PageUp') {
        moveFocus(findNextInput(start, 0, -1, inpClass, skipClass));
        event.preventDefault();
        return true;
    }
    else if (code == 'ArrowDown' || code == 'PageDown') {
        moveFocus(findNextInput(start, 0, 1, inpClass, skipClass));
        event.preventDefault();
        return true;
    }
    else if (verticalOnly) {
        return false;
    }

    // If !verticalOnly, consider horizontal movement keys
    else if (code == ArrowNext) {
        const next = event.ctrlKey ? findNextWordGroup2d(start, plusX)
            : findNextInput(start, plusX, 0, inpClass, skipClass);
        moveFocus(next);
        event.preventDefault();
        return true;
    }
    else if (code == ArrowPrior) {
        const prior = event.ctrlKey ? findNextWordGroup2d(start, -plusX)
            : findNextInput(start, -plusX, 0, inpClass, skipClass);
        moveFocus(prior);
        event.preventDefault();
        return true;
    }
    else if (code == 'Home') {
        moveFocus(findRowEndInput(start, -plusX, event.ctrlKey));
        return true;
    }
    else if (code == 'End') {
        moveFocus(findRowEndInput(start, plusX, event.ctrlKey));
        return true;
    }
    return false;
}

/**
 * Does a typed character match the input rules?
 * @param input 
 * @param evt 
 * @returns 
 */
function matchInputRules(input:TextInputElement, evt:KeyboardEvent) {
    if (input.readOnly) {
        return false;
    }
    if (evt.key.length != 1 || evt.ctrlKey || evt.altKey) {
        return false;
    }
    return (input.inputMode === 'numeric')
        ? evt.key.match(/[0-9]/) : evt.key.match(/[a-z0-9]/i);
}

/**
 * Callback when a user releases a keyboard key from any letter-input or word-input text field
 * @param event - A keyboard event
 */
export function onLetterKeyUp(event:KeyboardEvent) {
    if (event.isComposing) {
        return;  // Don't interfere with IMEs
    }
    var post = onLetterKey(event);
    if (post) {
        var input:HTMLInputElement = event.currentTarget as HTMLInputElement;
        inputChangeCallback(input, event.key);
    }
}

const mapInputEventTypes: Record<string, string> = {
    'deleteContentBackward': 'Backspace',
    'deleteContentForward': 'Delete',
    'insertParagraph': 'Enter'
}

/**
 * Convert an event from onInput to an equivalent key event.
 * Note: only happens when contents actually change, so no arrow keys,
 * nor backspace in empty cell :(
 * @param event event from OnImput
 * @returns Stub Keyboard event with a few key fields
 */
function fakeKeyboardEvent(event:InputEvent):KeyboardEvent {
    const fake = {
        code: '',
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        key: event.data,
        target: event.target,
        currentTarget: event.currentTarget,
    };
    if (event.inputType in mapInputEventTypes) {
        fake.code = mapInputEventTypes[event.inputType];
    }
    return fake as KeyboardEvent
}

/**
 * oninput callback, which is the only usable one we get on Android.
 * It should ALWAYS follow the key-down event
 * @param event - An input event, where .data holds the key
 */
export function onLetterInput(event:InputEvent) {
    // REVIEW: ignoring isComposing, since it is often true
    if (keyDownUnidentified) {
        const fake = fakeKeyboardEvent(event);
        onLetterKeyDown(fake);
        var post = onLetterKey(fake);
        if (post) {
            var input:HTMLInputElement = event.currentTarget as HTMLInputElement;
            inputChangeCallback(input, event.data || '');
        }
    }
}

/**
 * Process the end of a keystroke
 * @param evt - A keyboard event
 * @return true if some post-processing is still needed
 */
export function onLetterKey(evt:KeyboardEvent): boolean {
    if (!evt) {
        return false;
    }
    if (isDebug()) {
        alert('code:' + evt.code + ', key:' + evt.key);
    }

    var input:HTMLInputElement = evt.currentTarget as HTMLInputElement;
    if (input != keyDownTarget) {
        keyDownTarget = null;
        // key-down likely caused a navigation

        if (evt.code == 'Tab' && document.activeElement == input && isArrowKeyElement(document.activeElement)) {
            // Ensure we got the focus change
            setCurrentInputGroup(document.activeElement as ArrowKeyElement);
        }

        return true;
    }
    keyDownTarget = null;

    var code = evt.code;
    if (code == undefined || code == '') {
        code = evt.key;  // Mobile doesn't use code
    }
    if (code == 'Enter') {
        code = evt.shiftKey ? 'ArrowUp' : 'ArrowDown';
    }
    if (code == 'Tab') { // includes shift-Tab
        // Do nothing. User is just passing through
        // TODO: Add special-case exception to wrap around from end back to start
        return true;
    }
    // if (code == 'CapsLock') {
    //     // Do nothing. User hasn't typed
    //     return true;
    // }
    if (isArrowKey(code)) {
        // Do nothing. Navigation happened on key down.
        return true;
    }
    else if (code == 'Backquote') {
        return true;  // Highlight already handled in key down
    }
    if (input.value.length == 0 || ignoreKeys.indexOf(code) >= 0) {
        var multiLetter = hasClass(input.parentNode, 'multiple-letter');
        // Don't move focus if nothing was typed
        if (!multiLetter) {
            afterInputUpdate(input, evt.key);
            return false;  // we just did the post-processing
        }
    }
    else if (input.value.length === 1 && !input.value.match(/[a-z0-9]/i)) {
        // Spaces and punctuation might be intentional, but if they follow a matching literal, they probably aren't.
        // NOTE: this tends to fail when the punctuation is stylized like smart quotes or minus instead of dash.
        var prior = findNextOfClass(input, 'letter-input', undefined, -1);
        if (prior != null && hasClass(prior, 'letter-non-input') && findNextOfClass(prior, 'letter-input') == input) {
            if (prior.getAttribute('data-literal') == input.value) {
                input.value = '';  // abort this space
                return true;
            }
        }
    }
    afterInputUpdate(input, evt.key);
    return false;
}

/**
 * Re-scan for extractions
 * @param input The input which just changed
 * @param key The key from the event that led here
 */
export function afterInputUpdate(input:TextInputElement, key:string) {
    var text = input.value;
    if (hasClass(input.parentNode, 'lower-case')) {
        text = text.toLocaleLowerCase();
    }
    else if (!hasClass(input.parentNode, 'any-case')) {
        text = text.toUpperCase();
    }
    var overflow = '';
    var nextInput = findParentOfClass(input, 'vertical')
        ? findNextInput(input, 0, 1, 'letter-input', 'letter-non-input')
        : (findNextGroupInput(input, true, true, 'letter-input', 'letter-non-input') 
            || findNextInput(input, plusX, 0, 'letter-input', 'letter-non-input'));

    var multiLetter = hasClass(input.parentNode, 'multiple-letter');
    var word = multiLetter || hasClass(input.parentNode, 'word-cell') || hasClass(input, 'word-input');
    if (!word && text.length > 1) {
        const glyphs = splitEmoji(text);
        text = glyphs.splice(0, 1)[0];
        overflow = glyphs.join('');
    }
    input.value = text;
    
    ExtractFromInput(input);
    
    CheckValidationReady(input, key);

    if (!multiLetter) {
        if (isTextInputElement(nextInput) && overflow.length > 0 && nextInput.value.length == 0) {
            // Insert our overflow into the next cell
            nextInput.value = overflow;
            moveFocus(nextInput);
            // Then do the same post-processing as this cell
            afterInputUpdate(nextInput as TextInputElement, key);
        }
        else if (isArrowKeyElement(nextInput) && text.length > 0) {
            // Just move the focus
            moveFocus(nextInput);
        }            
    }
    else if (!hasClass(input.parentNode, 'getElementsByClassName')) {
        // What is our capacity before compressing?
        var rc = input.getBoundingClientRect();
        var ratio = input.inputMode == "numeric" ? 2 : 1.8;
        var cap = Math.floor(rc.width * ratio / rc.height);
        // Once we've exceeded our capacity, comress more for each character
        var spacing = (text.length <= cap) ? 0 : ((text.length - cap) * 0.05);
        input.style.letterSpacing = -spacing + 'em';
    }
    if (word) {
        saveWordLocally(input as HTMLInputElement);
    }
    else {
        saveLetterLocally(input as HTMLInputElement);
    }
    if (isTag(input, 'input')) {
        inputChangeCallback(input as HTMLInputElement, key);
    }
}

/**
 * If this input is hooked up to a validation button, see if it's now ready.
 * @param input The input that just changed.
 * @param key The most recent key that was typed
 */
function CheckValidationReady(input:TextInputElement, key:string) {
    const showReady = getOptionalStyle(input.parentElement, 'data-show-ready');
    if (showReady) {
        const btn = document.getElementById(showReady) as HTMLButtonElement;
        if (btn) {
            validateInputReady(btn, key);
        }    
    }
}

/**
 * Extract contents of an extract-flagged input
 * @param input an input field
 */
function ExtractFromInput(input:TextInputElement) {
    var extractedId = getOptionalStyle(input, 'data-extracted-id', undefined, 'extracted-');
    if (findParentOfClass(input, 'extract')) {
        UpdateExtraction(extractedId);
    }
    else if (findParentOfClass(input, 'extractor')) {  // can also be numbered
        UpdateExtractionSource(input);
    }
    else if (findParentOfClass(input, 'numbered')) {
        UpdateNumbered(extractedId);
    }
    else {
        const btnId = getOptionalStyle(input, 'data-show-ready');
        if (btnId) {
            // This is not a named extract field, but it still has a button
            const btn = document.getElementById(btnId) as HTMLButtonElement;
            if (btn) {
                validateInputReady(btn as HTMLButtonElement, input.value);
            }
        }
    }

    if (findParentOfClass(input, 'copy-extractee')) {
        updateCopyExtractions();
    }
}

/**
 * Ensure that two extraction sources are pointing at the same target.
 * Either or both could leave that undefined, in which case it is id=='extracted'.
 * @param extractedId The extractedId we're trying to match.
 * @param input Another input
 * @return true if they are effectively the same
 */
function sameExtractedTarget(extractedId:string|null, input:Element):boolean {
    const id2 = getOptionalStyle(input, 'data-extracted-id', undefined, 'extracted-');
    return (extractedId || 'extracted') === (id2 || 'extracted');
}

/**
 * Update an extraction destination
 * @param extractedId The id of an element that collects extractions
 */
function UpdateExtraction(extractedId:string|null) {
    const extracted = document.getElementById(extractedId || 'extracted');
    
    if (extracted == null) {
        return;
    }
    const join = getOptionalStyle(extracted, 'data-extract-join') || '';
    
    if (extracted.getAttribute('data-extraction-source') != 'data'
        && (extracted.getAttribute('data-number-pattern') != null || extracted.getAttribute('data-letter-pattern') != null)) {
        UpdateNumbered(extractedId);
        return;    
    }
    
    const inputs = document.getElementsByClassName('extract-input');
    const sorted_inputs = SortElements(inputs);
    const parts:string[] = [];
    let hiddens = false;
    let ready = true;
    for (let i = 0; i < sorted_inputs.length; i++) {
        const input = sorted_inputs[i];
        if (!sameExtractedTarget(extractedId, input)) {
            continue;
        }
        if (hasClass(input, 'extract-literal') || hasClass(input, 'letter-non-input')) {
            parts.push(HiddenExtract(input, false));
            hiddens = true;
        }
        else {
            const inp = input as HTMLInputElement;
            let letter = inp.value || '';
            letter = letter.trim();
            ready = ready && letter.length > 0;
            parts.push(letter || '_');
        }
    }
    if (hiddens) {
        let p = 0;
        for (let i = 0; i < sorted_inputs.length; i++) {
            const input = sorted_inputs[i];
            if (!sameExtractedTarget(extractedId, input)) {
                continue;
            }
            if (hasClass(input, 'extract-literal')) {
                parts[p] = HiddenExtract(input, ready, parts);
            }
            p++;
        }
    }
    let extraction = parts.join(join);

    ApplyExtraction(extraction, extracted, ready);
}

/**
 * Cause a value to be extracted directly from data- attributes, rather than from inputs.
 * @param elmt Any element - probably not an input
 * @param value Any text, or null to revert
 * @param extractedId The id of an element that collects extractions
 */
function ExtractViaData(elmt:HTMLElement, value:string|null, extractedId:string|null) {
    if (value == null) {
        elmt.removeAttribute('data-extract-value');
        toggleClass(elmt, 'extract-input', false);
        toggleClass(elmt, 'extract-literal', false);
    }
    else {
        elmt.setAttribute('data-extract-value', value);
        toggleClass(elmt, 'extract-literal', true);
        toggleClass(elmt, 'extract-input', true);
    }
    UpdateExtraction(extractedId);
}

/**
 * Hidden literal extracts often have rules for when they are applied.
 * @param span The (hidden) span that contains the literal value and possible rules
 * @param ready Whether the non-hidden inputs are now complete
 * @param extraction Either undefined, if still building, or a list of all extracted elements, of which this is one part.
 * @returns A letter to extract right now
 */
function HiddenExtract(span:Element, ready:boolean, extraction?:string[]):string {
    // Several ways to extract literals.
    // Old-style used data-* optional styles.
    // New style uses simpler names, only on current span.
    const de = span.hasAttributeNS('', 'delay') !== null     // placeholder value to extract, until player has finished other work
            ? span.getAttributeNS('', 'delay')               // empty is ok
            : getOptionalStyle(span, 'data-extract-delay');  
    const ev = span.getAttributeNS('', 'value')              // eventual extraction (unless a copy)
            || getOptionalStyle(span, 'data-extract-value'); 
    const ec = getOptionalStyle(span, 'data-extract-copy');  // this extraction is a copy of another
    const dl = getOptionalStyle(span, 'data-literal');       // this is a literal which is also an extraction
    if (!ready && de != null) {
        return de;
    }
    else if (ec) {
        // On the first pass, extraction may be undefined, so return ''. Later, copy another cell.
        return extraction ? extraction[parseInt(ec) - 1] : '';
    }
    else {
        return ev || dl || '';
    }

}

/**
 * Check whether a collection of extracted text is more than blanks and underlines
 * @param text Generated extraction, which may still contain underlines for missing parts
 * @returns true if text contains anything other than spaces and underlines
 */
function ExtractionIsInteresting(text:string): boolean {
    if (text == undefined) {
        return false;
    }
    return text.length > 0 && text.match(/[^_\u00A0\u0020]/) != null;
}

/**
 * Update an extraction area with new text
 * @param text The current extraction
 * @param dest The container for the extraction. Can be a div or an input
 * @param ready True if all contributing inputs have contributed
 */
function ApplyExtraction(   text:string, 
                            dest:HTMLElement,
                            ready:boolean) {
    if (hasClass(dest, 'create-from-pattern')) {
        ApplyExtractionToPattern(text, dest, ready);
        return;
    }

    if (hasClass(dest, 'lower-case')) {
        text = text.toLocaleLowerCase();
    }
    else if (hasClass(dest, 'all-caps')) {
        text = text.toLocaleUpperCase();
    }

    const destInp:HTMLInputElement|null = isTag(dest, 'INPUT') ? dest as HTMLInputElement : null;
    const destText:HTMLElement|null = isTag(dest, 'TEXT') ? dest as HTMLElement : null;
    const destFwd:HTMLElement|null = hasClass(dest, 'extract-literal') ? dest as HTMLElement : null;
    var current = (destInp !== null) ? destInp.value : (destText !== null) ? destText.innerHTML : dest.innerText;
    if (!ExtractionIsInteresting(text) && !ExtractionIsInteresting(current)) {
        return;
    }
    if (!ExtractionIsInteresting(text) && ExtractionIsInteresting(current)) {
        text = '';
    }
    if (destFwd) {
        destFwd.setAttributeNS('', 'value', text);
    }
    else if (destInp) {
        destInp.value = text;    
    }
    else if (destText) {
        destText.innerHTML = '';
        destText.appendChild(document.createTextNode(text));
    }
    else if (!hasClass(dest, 'create-from-pattern')) {
        dest.innerText = text;
    }

    updateExtractionData(dest, text, ready);

    if (isTag(dest, 'input')) {
        // It's possible that the destination is itself an extract source
        ExtractFromInput(dest as HTMLInputElement);
    }
    else if (destFwd) {
        // Or a hidden extract source
        var extractedId = getOptionalStyle(destFwd, 'data-extracted-id', undefined, 'extracted-');
        UpdateExtraction(extractedId);
    }
}

/**
 * Update an pattern-generated extraction area with new text
 * @param text The current extraction
 * @param extracted The container for the extraction.
 * @param ready True if all contributing inputs have contributed
 */
function ApplyExtractionToPattern(text:string, extracted:HTMLElement, ready:boolean) {
    const inps = extracted.getElementsByClassName('extractor-input');
    if (inps.length > text.length) {
        text += Array(1 + inps.length - text.length).join('_');
    }
    for (let i = 0; i < inps.length; i++) {
        const inp = inps[i] as HTMLInputElement;
        if (text[i] != '_') {
            inp.value = text.substring(i, i+1);
        }
        else {
            inp.value = '';
            ready = false;
        }
        // Save the extracted letter, just like the original, because typing into them directly would do that
        saveLetterLocally(inp);
    }
    updateExtractionData(extracted, text, ready);
}

/**
 * Update an extraction that uses numbered indicators
 * @param extractedId The id of an extraction area
 */
function UpdateNumbered(extractedId:string|null) {
    const div = document.getElementById(extractedId || 'extracted');
    var outputs = div?.getElementsByTagName('input');
    var inputs = document.getElementsByClassName('extract-input');
    const sorted_inputs = SortElements(inputs);
    let concat = '';
    for (let i = 0; i < sorted_inputs.length; i++) {
        const input = sorted_inputs[i];
        const inp = input as HTMLInputElement
        const index = input.getAttribute('data-number');
        let output = document.getElementById('extractor-' + index) as HTMLInputElement;
        if (!output && outputs) {
            output = outputs[i];
        }
        let letter = inp.value || '';
        letter = letter.trim();
        if (letter.length > 0 || output.value.length > 0) {
            output.value = letter;
        }
        concat += letter;
    }
    if (div) {
        updateExtractionData(div, concat, concat.length == inputs.length);
    }

}

/**
 * 
 * @param input 
 * @returns 
 */
function UpdateExtractionSource(input:TextInputElement) {
    var extractedId = getOptionalStyle(input, 'data-extracted-id', undefined, 'extracted-');

    var extractors = document.getElementsByClassName('extractor-input');
    var index = getOptionalStyle(input.parentNode as Element, 'data-number');
    if (index === null) {
        for (let i = 0; i < extractors.length; i++) {
            if (extractors[i] == input) {
                index = "" + (i + 1);  // start at 1
                break;
            }
        }
    }
    if (index === null) {
        return;
    }
    
    var sources = document.getElementsByClassName('extract-input');
    let extractId:any;
    const extraction:string[] = [];
    for (let i = 0; i < sources.length; i++) {
        var src = sources[i] as HTMLInputElement;
        if (!sameExtractedTarget(extractedId, src)) {
            continue;
        }

        var dataNumber = getOptionalStyle(src, 'data-number');
        if (dataNumber != null) {
            if (dataNumber == index) {
                src.value = input.value;
                saveLetterLocally(src);
                extractId = getOptionalStyle(src, 'data-extracted-id', undefined, 'extracted-');
            }
            extraction[parseInt(dataNumber)] = src.value;
        }
    }

    // Update data-extraction when the user type directly into an extraction element
    const extractionText = extraction.join('');
    updateExtractionData(extractId, extractionText, extractionText.length == sources.length);
}

/**
 * An extraction field has been updated.
 * See if there are further side-effects.
 * @param extracted The extracted field, or the ID of one.
 * @param value The value that has been extracted.
 * @param ready True if all contributors appear to be used (i.e. no blanks)
 */
function updateExtractionData(extracted:string|HTMLElement, value:string, ready:boolean) {
    const container = !extracted
        ? document.getElementById('extracted')
        : (typeof extracted === "string")
            ? document.getElementById(extracted as string)
            : extracted;
    if (container) {
        container.setAttribute('data-extraction', value);
        const btnId = getOptionalStyle(container, 'data-show-ready');
        if (btnId) {
            const btn = document.getElementById(btnId) as HTMLButtonElement;
            validateInputReady(btn as HTMLButtonElement, value);
        }
        if (btnId && isTrace()) {
            console.log('Extraction is ' + (ready ? 'ready:' : 'NOT ready:') + value);
        }
    }

}

/**
 * oninput callback, which is the only usable one we get on Android.
 * It should ALWAYS follow the key-down event
 * @param event - An input event, where .data holds the key
 */
export function onWordInput(event:InputEvent) {
    // REVIEW: ignoring isComposing, since it is often true
    if (keyDownUnidentified) {
        onWordKey(fakeKeyboardEvent(event));
    }
}

/**
 * User has typed in a word-entry field
 * @param event A Keyboard event
 */
export function onWordKey(event:KeyboardEvent) {
    if (event.isComposing) {
        return;  // Don't interfere with IMEs
    }

    const input = event.currentTarget as HTMLInputElement;
    inputChangeCallback(input, event.key);

    if (getOptionalStyle(input, 'data-extract-index') != null) {
        var extractId = getOptionalStyle(input, 'data-extracted-id', undefined, 'extracted-');
        updateWordExtraction(extractId);
    }
    if (findParentOfClass(input, 'copy-extractee')) {
        updateCopyExtractions();
    }
    CheckValidationReady(input, event.key);

    var code = event.code;
    if ((code == 'Enter' || code == 'NumpadEnter') && getOptionalStyle(input, 'data-show-ready')) {
        // do nothing
    }
    else if (code == 'PageUp') {
        moveFocus(findNextOfClass(input, 'word-input', undefined, -1) as HTMLInputElement);
        return;
    }
    else if (code == 'Enter' || code == 'NumpadEnter' || code == 'PageDown') {
        moveFocus(findNextOfClass(input, 'word-input') as HTMLInputElement);
        return;
    }

    saveWordLocally(input);
}

/**
 * Update extractions that come from word input
 * @param extractedId The ID of an extraction area
 */
export function updateWordExtraction(extractedId:string|null) {
    var extracted = document.getElementById(extractedId || 'extracted');

    if (extracted == null) {
        return;
    }
    
    let inputs = document.getElementsByClassName('word-input');
    const sorted_inputs = SortElements(inputs);
    const parts:string[] = [];
    let hasWordExtraction = false;
    let partial = false;
    let ready = true;
    let hiddens = false;
    for (let i = 0; i < sorted_inputs.length; i++) {
        const input = sorted_inputs[i];
        if (!sameExtractedTarget(extractedId, input)) {
            continue;
        }
        if (hasClass(input, 'extract-literal') || hasClass(input, 'word-literal')) {
            parts.push(HiddenExtract(input, false));
            hiddens = true;
            continue;
        }
        var index = getOptionalStyle(input, 'data-extract-index', '') as string;
        if (index === null) {
            continue;
        }
        hasWordExtraction = true;
        const indeces = index.split(' ');
        let letters = '';
        for (let j = 0; j < indeces.length; j++) {
            const inp = input as HTMLInputElement;
            let letter = inp.value;
            if (indeces[j] !== '*') {
                const i2 = indeces[j].split('.').map((s) => parseInt(s, 10));
                letter = extractWordIndex(inp.value, i2[0], i2.length > 1 ? i2[1] : 0, '_', '');
            }
            
            if (letter) {
                letters += letter.toUpperCase();;
                partial = partial || (letter != '_');
                ready = ready && (letter != '_');
            }
        }
        parts.push(letters);
    }
    if (hiddens) {
        let p = 0;
        for (let i = 0; i < sorted_inputs.length; i++) {
            const input = sorted_inputs[i];
            if (!sameExtractedTarget(extractedId, input)) {
                continue;
            }
            if (hasClass(input, 'extract-literal')) {
                parts[p] = HiddenExtract(input, ready, parts);
            }
            p++;
        }
    }
    let extraction = parts.join('');

    if (hasWordExtraction) {
        ApplyExtraction(extraction, extracted, ready);
    }
}

/**
 * Extract a single letter from an input. 
 * Can have a simple or two-part index.
 * Simple: an absolute index, starting at 1, ignoring whitespace
 * Two-part: word# and letter#, both starting at 1
 * @param input User's input string
 * @param index The primary index (starting at 1)
 * @param subIndex The secondary index (starting at 1), or 0 to only use the primary index
 * @param ifBlank What to return from blank inputs
 * @param ifOver What to return if the index is out of bounds
 * @returns The extracted letter, or else the blank or over fallbacks
 */
export function extractWordIndex(input:string, index:number, subIndex:number, ifBlank:string, ifOver:string):string {
    if (!input.trim()) {
        return ifBlank;
    }
    else {
        input = input.toUpperCase();
    }
    
    let letter_index:number = index;
    if (subIndex > 0) {
        letter_index = subIndex;
        // Reduce input to just the desired word
        const words = input.split(' ');
        input = '';
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (words[i].length > 0) {
                if (--index == 0) {
                    input = word;
                    break;
                }
            }
        }
    }

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch.trim()) {
            if (--letter_index == 0) {
                return ch;
            }
        }
    }
    // Index not reached
    return ifOver;
}

/**
 * Find all elements tagged as copy-extracters.
 * Read their copy-id rules, and fetch the data.
 * Extracting from an empty input, or an invalid index within an input, will yield a blank.
 * Extracters can have multiple source extractees, in which case missing partial data will generate spaces.
 * 
 * Unlike push-extracters, which work in both directions, these copy-extracters only work in one direction.
 * Changing the destination will not be reflected back into the source, 
 * since the primary intended use is indexes into longer entries.
 */
function updateCopyExtractions() {
    const extracters = document.getElementsByClassName('copy-extracter');
    for (let i = 0; i < extracters.length; i++) {
        let extracter = extracters[i];
        const ifBlank = getOptionalStyle(extracter, 'data-copy-blank', '') || '';
        let buf = '';
        let spaces = '';

        const copyIds = (getOptionalStyle(extracter, 'data-copy-id', '') || '').split(' ');
        for (let s = 0; s < copyIds.length; s++) {
            const copyId = copyIds[s].split('.');
            if (copyId[0]) {
                let extractee = document.getElementById(copyId[0]);
                let value = getValueFromTextContainer(extractee as TextInputElement, '');
                if (copyId.length == 2) {
                    value = extractWordIndex(value, parseInt(copyId[1]), 0, '', '');
                }
                else if (copyId.length > 2) {
                    value = extractWordIndex(value, parseInt(copyId[1]), parseInt(copyId[2]), ifBlank, ifBlank);
                }
                if (!value) {
                    spaces += ' ';
                }
                else {
                    buf += spaces + value;
                    spaces = '';
                }
            }
        }

        if (!isTextInputElement(extracter)) {
            let extracters = extracter?.getElementsByTagName('input');
            if (!extracters || extracters.length == 0) {
                throw new Error(`Element with copy-id=${copyIds} must be an input element, or a letter-/word-cell parent of one`);
            }
            else if (extracters.length > 1) {
                throw new Error(`Element with copy-id=${copyIds} appears to be a container of multiple input elements`);
            }
            extracter = extracters[0];
            if (!isTextInputElement(extracter)) {
                throw new Error(`Element with copy-id=${copyIds} must be an input element, or a letter-/word-cell parent of one`);
            }
        }
        (extracter as TextInputElement).value = buf.trim();
    }
}


/**
 * Callback when user has changed the text in a letter-input 
 * @param event A keyboard event
 */
export function onLetterChange(event:KeyboardEvent) {
    if (event.isComposing) {
        return;  // Don't interfere with IMEs
    }

    const input = findParentOfClass(event.currentTarget as Element, 'letter-input') as HTMLInputElement;
    saveLetterLocally(input);
    inputChangeCallback(input, event.key);
}

/**
 * Callback when user has changed the text in a word-input 
 * @param event A keyboard event
 */
export function onWordChange(event:KeyboardEvent) {
    if (event.isComposing) {
        return;  // Don't interfere with IMEs
    }

    const input = findParentOfClass(event.currentTarget as Element, 'word-input') as HTMLInputElement;
    inputChangeCallback(input, event.key);
    saveWordLocally(input);
}

type onChangeCallback = (inp:TextInputElement, key:string) => void;

/**
 * Anytime any note changes, inform any custom callback
 * @param inp The affected input
 * @param key The key from the event that led here
 */
function inputChangeCallback(inp:TextInputElement, key:string) {
    const fn = theBoiler().onInputChange;
    if (fn) {
        fn(inp);
    }
    const doc = getOptionalStyle(inp, 'data-onchange');
    if (doc) {
        const func = (window as any)[doc] as onChangeCallback;
        if (func) {
            func(inp, key);
        }
    }
}

/**
 * Standardize on letter-grid-2d navigation rules.
 * If defined, then the grid may have a narrowed scope.
 * If undefined, the entire page should follow these rules.
 * @param start 
 * @returns 
 */
function GetArrowKeyRoot(start: ArrowKeyElement): Element|null {
    const root2d = findParentOfClass(start, 'letter-grid-2d');
    // TODO: someday, support a non-2d style when I have a real example
    return root2d ?? document.getElementById('pageBody');
}

/**
 * Find the input that the user likely means when navigating from start in a given x,y direction
 * @param start - The current input
 * @param dx - A horizontal direction to look
 * @param dy - A vertical direction to look
 * @param cls - a class to look for
 * @param clsSkip - a class to skip
 * @returns 
 */
function findNextInput( start: ArrowKeyElement, 
                        dx: number, 
                        dy: number, 
                        cls: string, 
                        clsSkip: string|undefined)
                        : ArrowKeyElement {
    const root2d = GetArrowKeyRoot(start);
    const loop = findParentOfClass(start, 'loop-navigation');
    let find:ArrowKeyElement|null = null;
    if (root2d != null) {
        // Ignore the class constraint for 2d and discover
        find = findNext2dInput(root2d, start, dx, dy, undefined, clsSkip);
        if (find != null) {
            return find;
        }
    }
    const discoverRoot = findParentOfClass(start, 'letter-grid-discover');
    if (discoverRoot != null) {
        find = findNextDiscover(discoverRoot, start, dx, dy, undefined, clsSkip);
        if (find != null) {
            return find;
        }
        find = findNextByPosition(discoverRoot, start, dx, dy, undefined, clsSkip);
        if (find != null) {
            return find;
        }
    }
    if (dy < 0) {
        find = findInNextContainer(start, cls, clsSkip, 'letter-cell-block', -1) as ArrowKeyElement;
        if (find != null) {
            return find;
        }
    }
    if (dy > 0) {
        find = findInNextContainer(start, cls, clsSkip, 'letter-cell-block') as ArrowKeyElement;
        if (find != null) {
            return find;
        }
    }
    const back = dx == -plusX || dy < 0;
    let next = findNextOfClassGroup(start, cls, clsSkip, 'text-input-group', back ? -1 : 1) as ArrowKeyElement;
    while (next != null && next.disabled) {
        next = findNextOfClassGroup(next, cls, clsSkip, 'text-input-group', back ? -1 : 1) as ArrowKeyElement;
    }
    if (loop != null && findParentOfClass(next, 'loop-navigation') != loop) {
        find = findFirstChildOfClass(loop, cls, clsSkip, back ? -1 : 1) as ArrowKeyElement;
        if (find) {
            return find;
        }
    }
    return next;
}

/**
 * Helper for home/end movement
 * @param start The current input
 * @param dx Home=-1, End=1
 * @param global true for ctrl+home/end, going to begining or end of whole range
 * @returns An element on this row
 */
function findRowEndInput(start: ArrowKeyElement, dx: number, global:boolean)
                            : ArrowKeyElement {
    if (!global && currentInputGroup) {
        // Go to start or end of group
        let row = getInputGroupMembers(currentInputGroup)
        if ((plusX * dxFromGroup(currentInputGroup) < 0) || (dyFromGroup(currentInputGroup) < 0)) {
            // Group goes backward
            dx = -dx;
        }
        return (dx > 0 ? row[row.length - 1] : row[0]);
    }
    
    const root2d = GetArrowKeyRoot(start);
    if (root2d) {
        let row:ArrowKeyElement[];
        if (global) {
            row = findRowOfInputs(root2d, undefined, -dx, undefined, 'letter-non-input');
        }
        else {
            row = findRowOfInputs(root2d, start, 0, undefined, 'letter-non-input');
        }
        
        return (dx > 0 ? row[row.length - 1] : row[0]);
    }
    return findEndInContainer(start, 'letter-input', 'letter-non-input', 'letter-cell-block', -dx) as ArrowKeyElement;
}

/**
 * Space and Backspace are both ways to clear input fields.
 * Space clears forwards. Backspace clears backwards.
 * Both will first clear the current cell. If already empty, then move.
 * Edge cases:
 *  - In multi-letter cells, backspace removes just one letter until empty. Then moves.
 *  - Space within a pattern that contains spaces at that point are ignored.
 * @param input The input where the user typed
 * @param code Either 'Space' or 'Backspace'
 * @returns True if position moved. False if treated as a no-op.
 */
function spaceOverNextInput(input: TextInputElement, code: string) {
    let prior: TextInputElement|null = null;
    if (code == 'Space') {
        // Make sure user isn't just typing a space between words
        prior = findNextOfClass(input, 'letter-input', undefined, -1) as HTMLInputElement;
        if (prior != null && hasClass(prior, 'letter-non-input') && findNextOfClass(prior, 'letter-input') == input) {
            var lit = prior.getAttribute('data-literal');
            if (lit == ' ' || lit == '¶') {  // match any space-like things  (lit == '¤'?)
                prior = findNextOfClass(prior, 'letter-input', 'literal', -1) as HTMLInputElement;
                if (prior != null && prior.value != '') {
                    // This looks much more like a simple space between words
                    return false;
                }
            }
        }
    }

    if (input != null && currentInputGroup) {
        // Space and backspace at the end of a group no longer need to obey the group.
        let row = getInputGroupMembers(currentInputGroup)
        let index = row.indexOf(input);
        if (index >= 0) {
            if (code == 'Backspace') {
                // Clear current if not empty, else move back and clear that
                if (input.value.length == 0 && index > 0) {
                    input = row[index - 1] as TextInputElement;
                    moveFocus(input);
                }
            }
            else  {
                // Clear current if not empty, else move forward and clear that
                if (input.value.length == 0 && index < row.length - 1) {
                    input = row[index + 1] as TextInputElement;
                    moveFocus(input);
                }
            }
            if (input.value.length > 0) {
                // Clear current if not empty
                input.value = '';
                afterInputUpdate(input, code);
            }
            return true;
        }
        return false;
    }

    // Delete only deletes the current cell
    // Space deletes and moves forward
    prior = null;
    var dxDel = code == 'Backspace' ? -plusX : plusX;
    var dyDel = code == 'Backspace' ? -1 : 1;
    if (priorInputValue.length == 0) {
        var discoverRoot = findParentOfClass(input, 'letter-grid-discover');
        if (discoverRoot != null) {
            prior = findParentOfClass(input, 'vertical')
                ? findNextByPosition(discoverRoot, input, 0, dyDel, 'letter-input', 'letter-non-input') as TextInputElement
                : findNextByPosition(discoverRoot, input, dxDel, 0, 'letter-input', 'letter-non-input') as TextInputElement;
        }
        else {
            prior = findNextOfClassGroup(input, 'letter-input', 'letter-non-input', 'text-input-group', dxDel) as HTMLInputElement;
            if (!prior) {
                const loop = findParentOfClass(input, 'loop-navigation');
                if (loop) {
                    prior = findFirstChildOfClass(loop, 'letter-input', 'letter-non-input', dxDel) as HTMLInputElement;
                }
            }
        }
        ExtractFromInput(input);
        if (prior !== null) {
            moveFocus(prior);
            input = prior;  // fall through
        }
    }
    if (input != null && input.value.length > 0) {
        if (!hasClass(input.parentNode as Element, 'multiple-letter')) {
            // Backspace should clear most cells
            input.value = '';
        }
        else if (prior != null) {
            // If backspacing across cells, into a multiple-letter cell, just remove the last character
            // REVIEW: should this behavior also apply when starting in multi-letter cells?
            if (dyDel < 0) {
                input.value = input.value.substring(0, input.value.length - 1);
            }
            else {
                input.value = input.value.substring(1);
            }
        }
    }
    afterInputUpdate(input, code);
    return true;
}

/**
 * Achieve ctrl+left/right functionality, attempting to jump past any inputs left in the current group.
 * 
 * @param start 
 * @param dx 
 */
function findNextWordGroup2d(start: ArrowKeyElement, dx: number):ArrowKeyElement {
    const root2d = GetArrowKeyRoot(start);
    const row = findRowOfInputs(root2d || undefined, start, 0, undefined, 'letter-non-input');
    if (row.length == 1) {
        // If we're alone in the current row, the ctrl+arrow is the same as arrow
        return findNextInput(start, dx, 0, 'letter-input', 'letter-non-input');
    }

    // Measure the average distance between elements;
    let avgGap = 0;
    const rects:DOMRect[] = [row[0].getBoundingClientRect()];
    let iCur = 0;
    for (let i = 1; i < row.length; i++) {
        if (row[i] === start) {
            iCur = i;
        }
        const rc = row[i].getBoundingClientRect();
        avgGap += rc.left - rects[i - 1].right;
        rects.push(rc);
    }
    avgGap /= row.length - 1;
    avgGap *= 1.01;  // Don't let tiny margins of error confuse us

    // Move forward/back past any consecutive cells whose gap <= the average
    if (dx > 0) {
        for (let i = iCur + 1; i < row.length; i++) {
            const gap = rects[i].left - rects[i - 1].right;
            if (gap > avgGap) {
                return row[i];
            }
        }    
        // None found. Move to first item on the next line
        return findNextInput(row[row.length - 1], 1, 0, 'letter-input', 'letter-non-input');
    }
    else {
        for (let i = iCur - 1; i >= 0; i--) {
            const gap = rects[i + 1].left - rects[i].right;
            if (gap > avgGap) {
                return row[i];
            }
        }    
        // None found. Move to first item on the next line
        return findNextInput(row[0], -1, 0, 'letter-input', 'letter-non-input');
    }
}

/**
 * Find the next element with a desired class, within a parent defined by its class.
 * @param start - The current element
 * @param cls - The class of siblings
 * @param clsSkip - (optional) Another class to avoid
 * @param clsGroup - The class of the containing ancestor
 * @param dir - 1 (default) to look forward, or -1 to look backward
 * @returns Another element, or null if none
 */
function findNextOfClassGroup(  start: Element,
                                cls: string, 
                                clsSkip: string|undefined, 
                                clsGroup: string, 
                                dir:number = 1)
                                : Element|null {
    var group = findParentOfClass(start, clsGroup);
    var next = findNextOfClass(start, cls, clsSkip, dir);
    if (group != null && (next == null || findParentOfClass(next, clsGroup) != group)) {
        next = findFirstChildOfClass(group, cls, clsSkip, dir);
    }
    return next;
}

/**
 * Compare the two elements' vertical rectangles.
 * @param a One element
 * @param b Another element that is even with, above, or below.
 * @returns 0 if they appear to be on the same row; 
 * -1 if cur is higher; 1 if cur is lower.
 */
function compareVertical(a:Element, b:Element): number {
    const rcA = a.getBoundingClientRect();
    const rcB = b.getBoundingClientRect();
    if (rcA.top >= rcB.bottom) {
        return 1;
    }
    if (rcA.bottom <= rcB.top) {
        return -1;
    }
    return 0;  // Some amount of vertical overlap
}

/**
 * Compare the two elements' horizontal rectangles.
 * @param cur One element
 * @param test Another element that is even with, left, or right.
 * @returns 0 if they appear to be on the same column; 
 * -1 if cur is more left; 1 if cur is more right.
 * @remarks Don't let tiny overlaps confuse the math. 
 * These are especially likely when slightly rotated.
 */
function compareHorizontal(a:Element, b:Element): number {
    const rcA = scaleDOMRect(a.getBoundingClientRect(), 0.9);
    const rcB = scaleDOMRect(b.getBoundingClientRect(), 0.9);
    if (rcA.left >= rcB.right) {
        return 1;
    }
    if (rcA.right <= rcB.left) {
        return -1;
    }
    return 0;  // Some amount of horizontal overlap
}

/**
 * Inflate or shrink a rectangle around its center.
 * @param rect The original rectangle
 * @param scale Size of the returned rect, relative to the original.
 * @returns the original rect if scale==1.
 * Or a smaller rect if scale<1. Or a larger rect if scale>1.
 */
function scaleDOMRect(rect: DOMRect, scale: number): DOMRect {
    return new DOMRect(
        (rect.x + rect.width / 2) - (rect.width * scale / 2),
        (rect.y + rect.height / 2) - (rect.height * scale / 2),
        rect.width * scale,
        rect.height * scale
    );
}

/**
 * Get all of the input-type fields that can hold text focus.
 * These include <input>, <textarea>, <select>
 * @param container The container to search. If unset, use the document.
 * @param cls A list of classes to filter for. If unset/blank, don't filter. 
 * If multiple classes (separated by spaces), use OR logic (REVIEW).
 * @param clsSkip A list of classes to filter out. 
 * If a list, presence of any will cause it to be skipped.
 */
function getAllFormFields(  container?:Element|Document, 
                            cls?: string, 
                            clsSkip?: string):ArrowKeyElement[] {
    const all:ArrowKeyElement[] = [];
    const tags = ['input', 'textarea', 'select', 'button'];

    const classes = cls ? cls.split(' ') : undefined;
    const skips = clsSkip ? clsSkip.split(' ') : undefined;

    if (!container) {
        container = document;
    }
    for (let t = 0; t < tags.length; t++) {
        const list = container.getElementsByTagName(tags[t]);
        for (let i = 0; i < list.length; i++) {
            const elmt = list[i] as ArrowKeyElement;
            let match = !classes;
            if (classes) {
                for (let c = 0; c < classes.length; c++) {
                    if (hasClass(elmt, classes[c])) {
                        match = true;
                        break;  // any class is enough
                    }
                }
            }
            if (match && skips) {
                for (let c = 0; c < skips.length; c++) {
                    if (hasClass(elmt, skips[c])) {
                        match = false;
                        break;  // any class is enough
                    }
                }
            }
            if (match) {
                all.push(elmt);
            }
        }
    }

    return all;
}

/**
 * Find a row's worth of elements. This assumes rigid row-wise layout.
 * @param container The container to stay within
 * @param current The current element, or undefined to find the first/last row
 * @param dy 0 to find the rest of the current row;
 * -1 to find the row prior to current; 1 to find the next row.
 * When current is omitted, dy<0 means find the last overall row; dy>0 means find the first.
 * @param cls The class of elements to consider
 * @param clsSkip A sub-class of elements to leave out
 * @returns A list of elements, all of whom are on one vertical row. 
 * The list will be sorted.
 */
function findRowOfInputs(   container:Element|undefined, 
                            current:ArrowKeyElement|undefined, 
                            dy:number,
                            cls?: string, 
                            clsSkip?: string):ArrowKeyElement[] {
    const all = getAllFormFields(container, cls, clsSkip);
    let ref = dy == 0 ? current : undefined;
    if (!current && dy == 0) {
        throw new Error("Can't search for the current row, without a current reference");
    }
    let row:ArrowKeyElement[] = [];
    for (let i = 0; i < all.length; i++) {
        const elmt = all[i];
        let rel = dy;
        if (current) {
            rel = compareVertical(elmt, current);
            if (rel == 0 && dy == 0) {
                row.push(elmt);
            }
        }
        if (rel * dy > 0) {
            // Correct direction, relative to current
            if (!ref) {
                ref = elmt;  // This is the first element we've found in the desired direction
                row = [elmt];
            }
            else {
                const rel2 = compareVertical(elmt, ref);
                if (rel2 == 0) {
                    row.push(elmt);
                }
                else if (rel2 * dy < 0) {
                    ref = elmt;  // Found a better reference, nearer in the desired direction
                    row = [elmt];
                }
            }
        }
    }
    // Sort the row from left to right
    row.sort((a,b) => compareHorizontal(a, b));
    return row;
}

/**
 * Find the input that the user likely means when navigating through a well-formed 2d grid
 * @param root - The root ancestor of the entire grid
 * @param start - The current input
 * @param dx - A horizontal direction to look
 * @param dy - A vertical direction to look
 * @param cls - a class to look for
 * @param clsSkip - a class to skip
 * @returns Another input within the grid
 */
function findNext2dInput(   root: Element, 
                            start: ArrowKeyElement|undefined, 
                            dx: number, 
                            dy: number, 
                            cls: string|undefined, 
                            clsSkip: string|undefined)
                            : ArrowKeyElement|null {

    // Find one row of elements
    let row = findRowOfInputs(root, start, dy, cls, clsSkip);
    if (row.length == 0) {
        if (dy == 0) {
            return start || null; // Very confusing
        }
        // Wrap around
        const col = findNext2dColumn(root, dy);
        row = findRowOfInputs(col, undefined, dy, cls, clsSkip);
    }
    if (!start || (dy != 0 && dx != 0)) {
        // When changing rows, we want the first or last
        if (dx >= 0) {
            return row[0];
        }
        return row[row.length - 1];
    }
    let last:ArrowKeyElement|undefined;
    for (let i = 0; i < row.length; i++) {
        const elmt = row[i];
        const relX = compareHorizontal(elmt, start);
        if ((dx == 0 && relX == 0) || (dx >= 0 && relX > 0)) {
            return elmt;  // The first item that matches the qualification
        }
        else if (dx <= 0 && relX < 0) {
            last = elmt;  // A candidate. Let's see if we find a closer one.
        }
    }
    if (!last && dy == 0) {
        // Wrap to next/previous line
        return findNext2dInput(root, start, dx, dx * plusX, cls, clsSkip);
    }
    return last || null;
}

/**
 * If there are multile root elements of class letter-grid-2d, then reaching 
 * the end of one should find the next.
 * @param root The current letter-grid-2d
 * @param dir +1 for forward, -1 for prev, where direction is HTML order, not rectangles
 * @returns A root to restart from
 */
function findNext2dColumn(root: Element, dir: number): Element {
    if (!hasClass(root, 'letter-grid-2d')) {
        return root;  // We aren't in columns - this is the pageBody
    }
    const cols = document.getElementsByClassName('letter-grid-2d');
    if (cols) {
        for (let i = 0; i < cols.length; i++) {
            if (cols[i] == root) {
                let n = (i + cols.length + dir) % cols.length;
                return cols[n];
            }
        }
    }
    return document.getElementById('pageBody') as Element;
}

/**
 * Find the input that the user likely means when navigating through a jumbled 2d grid
 * @param root - The root ancestor of the entire grid
 * @param start - The current input
 * @param dx - A horizontal direction to look
 * @param dy - A vertical direction to look
 * @param cls - a class to look for
 * @param clsSkip - a class to skip
 * @returns Another input within the grid
 */
function findNextByPosition(root: Element,
                            start: ArrowKeyElement, 
                            dx: number, 
                            dy: number, 
                            cls: string|undefined, 
                            clsSkip: string|undefined)
                            : ArrowKeyElement|null {
    let rect = start.getBoundingClientRect();
    let pos = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    const elements = getAllFormFields(document, cls);
    let distance = 0;
    let nearest:ArrowKeyElement|null = null;
    for (let i = 0; i < elements.length; i++) {
        const elmt = elements[i];
        if (clsSkip != undefined && hasClass(elmt, clsSkip)) {
            continue;
        }
        if (root != null && root != findParentOfClass(elmt, 'letter-grid-discover')) {
            continue;
        }
        rect = elmt.getBoundingClientRect();
        if (dx != 0) {
            // Look for inputs in the same row
            if (pos.y >= rect.y && pos.y < rect.y + rect.height) {
                // Measure distance in the dx direction
                const d = (rect.x + rect.width / 2 - pos.x) / dx;
                // Keep the nearest
                if (d > 0 && (nearest == null || d < distance)) {
                    distance = d;
                    nearest = elmt;
                }
            }
        }
        else if (dy != 0) {
            // Look for inputs in the same column
            if (pos.x >= rect.x && pos.x < rect.x + rect.width) {
                // Measure distance in the dy direction
                const d = (rect.y + rect.height / 2 - pos.y) / dy;
                if (d > 0 && (nearest == null || d < distance)) {
                    // Keep the nearest
                    distance = d;
                    nearest = elmt;
                }
            }
        }
    }
    if (nearest != null) {
        return nearest;
    }

    // Try again, but look in the next row/column
    rect = start.getBoundingClientRect();
    pos = plusX > 0 ? { x: rect.x + (dy > 0 ? rect.width - 1 : 1), y: rect.y + (dx > 0 ? rect.height - 1 : 1) }
                    : { x: rect.x + (dy < 0 ? rect.width - 1 : 1), y: rect.y + (dx < 0 ? rect.height - 1 : 1) }
    let distance2 = 0;
    let wrap:ArrowKeyElement|null = null;
    for (let i = 0; i < elements.length; i++) {
        const elmt = elements[i];
        if (clsSkip != undefined && hasClass(elmt, clsSkip)) {
            continue;
        }
        if (root != null && root != findParentOfClass(elmt, 'letter-grid-discover')) {
            continue;
        }
        // Remember the first element (if dx/dy is positive), or else the last
        if (wrap == null || (dx < 0 || dy < 0)) {
            wrap = elmt;
        }
        rect = elmt.getBoundingClientRect();
        // d measures direction in continuing perpendicular direction
        // d2 measures relative position within original direction
        let d = 0, d2 = 0;
        if (dx != 0) {
            // Look for inputs in the next row, using dx as a dy
            d = (rect.y + rect.height / 2 - pos.y) / (dx * plusX);
            d2 = rect.x / dx;
        }
        else if (dy != 0) {
            // Look for inputs in the next row, using dx as a dy
            d = (rect.x + rect.width / 2 - pos.x) / (dy * plusX);
            d2 = rect.y / dy;
        }
        // Remember the earliest (d2) element in nearest next row (d)
        if (d > 0 && (nearest == null || d < distance || (d == distance && d2 < distance2))) {
            distance = d;
            distance2 = d2;
            nearest = elmt;
        }
    }
    return nearest != null ? nearest : wrap;
}

/**
 * Smallest rectangle that bounds both inputs
 */
function union(rect1:DOMRect, rect2:DOMRect) :DOMRect {
    const left = Math.min(rect1.left, rect2.left);
    const right = Math.max(rect1.right, rect2.right);
    const top = Math.min(rect1.top, rect2.top);
    const bottom = Math.max(rect1.bottom, rect2.bottom);
    return new DOMRect(left, top, right - left, bottom - top);
  }

/**
 * Distort a distance by a sympathetic factor
 * @param delta An actual distance (either horizontal or vertical)
 * @param bias A desired direction of travel, within that axis
 * @returns Shrinks delta, when it aligns with bias, stretches when orthogonal, and -1 when in the wrong direction
 */
function bias(delta:number, bias:number) {
    if (bias != 0) {
        if (delta * bias > 0) {
            return Math.abs(delta * 0.8);  // sympathetic bias shrinks distance
        }
        else {
            return -1;  // anti-bias invalidates distance
        }
    }
    return Math.abs(delta) * 1.2;  // orthogonal bias stretches distance
}

/**
 * Measure the distance from one point to another, given a biased travel direction
 * @param from the starting point
 * @param toward the destination point
 * @param bx the desired x movement
 * @param by the desired y movement
 * @returns a skewed distance, where some objects seem nearer and some farther.
 * A negative distance indicates an object in the wrong direction.
 */
function biasedDistance(from:DOMPoint, toward:DOMPoint, bx:number, by:number) :number {
    let dx = bias(toward.x - from.x, bx);
    let dy = bias(toward.y - from.y, by);
    if (dx < 0 || dy < 0) {
        return -1;  // Invalid target
    }
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * When moving off the edge of a world, what is a position on the far side, where we might resume?
 * @param world the boundary rectangle of the world
 * @param pos the starting point
 * @param dx the movement of x travel
 * @param dy the movement of y travel
 * @returns A position aligned with pos, but on the side away from dx,dy
 */
function wrapAround(world:DOMRect, pos:DOMPoint, dx:number, dy:number) :DOMPoint {
    if (dx > 0) {  // wrap around right to far left
        return new DOMPoint(world.left - dx, pos.y);
    }
    if (dx < 0) {  // wrap around left to far right
        return new DOMPoint(world.right - dx, pos.y);
    }
    if (dy > 0) {  // wrap around bottom to far top
        return new DOMPoint(pos.x, world.top - dy);
    }
    if (dy < 0) {  // wrap around top to far bottom
        return new DOMPoint(pos.x, world.bottom - dy);
    }
    return pos;
}

/**
 * Find the input that the user likely means when navigating through a jumbled 2d grid
 * @param root - The root ancestor of the entire grid
 * @param start - The current input
 * @param dx - A horizontal direction to look
 * @param dy - A vertical direction to look
 * @param cls - a class to look for
 * @param clsSkip - a class to skip
 * @returns Another input within the grid
 */
function findNextDiscover(root: Element,
                            start: Element, 
                            dx: number, 
                            dy: number, 
                            cls: string|undefined, 
                            clsSkip: string|undefined)
                            : ArrowKeyElement|null {
    let rect = start.getBoundingClientRect();
    let bounds = rect;
    let pos = new DOMPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    const elements = getAllFormFields(document, cls);
    let distance = -1;
    let nearest:ArrowKeyElement|null = null;
    for (let i = 0; i < elements.length; i++) {
        const elmt = elements[i];
        if (clsSkip != undefined && hasClass(elmt, clsSkip)) {
            continue;
        }
        if (root != null && root != findParentOfClass(elmt, 'letter-grid-discover')) {
            continue;
        }
        rect = elmt.getBoundingClientRect();
        bounds = union(bounds, rect);
        let center = new DOMPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        let d2 = biasedDistance(pos, center, dx, dy);
        if (d2 > 0 && (nearest == null || d2 < distance)) {
            nearest = elmt;
            distance = d2;
        }
    }
    if (nearest == null) {
        // Wrap around
        pos = wrapAround(bounds, pos, dx, dy);
        for (let i = 0; i < elements.length; i++) {
            const elmt = elements[i];
            if (clsSkip != undefined && hasClass(elmt, clsSkip)) {
                continue;
            }
            if (root != null && root != findParentOfClass(elmt, 'letter-grid-discover')) {
                continue;
            }
            rect = elmt.getBoundingClientRect();
            let center = new DOMPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
            let d2 = biasedDistance(pos, center, dx, dy);
            if (d2 > 0 && (nearest == null || d2 < distance)) {
                nearest = elmt;
                distance = d2;
            }
        }
    }
    return nearest;
}

/**
 * Autocomplete the contents of a multi-letter input from a restricted list of options.
 * Existing text must match the beginning of exactly one option (case-insensitive).
 * @param input a text <input> or <textarea>
 * @param list a list of potential values to complete to
 * @returns true if a single match was found, else false for 0 or multiple matches
 */
export function autoCompleteWord(input:HTMLInputElement|HTMLTextAreaElement, list:string[]) {
    var value = input.value.toLowerCase();
    var match:string|null = null;
    for (let i of list) {
      if (i.toLowerCase().indexOf(value) == 0) {
        if (match) {
          return false;  // multiple matches
        }
        match = i;
      }
    }
    if (match) {
      var len = input.value.length;
      input.value = match;
      input.setSelectionRange(len, match.length);  // Select the remainder of the word
      return true;
    }
    return false;  // no matches
}

/**
 * What group, if any, is this element active in?
 * If more than one, continue with the current group if possible.
 * @param elmt An element
 * @returns The name of a group, or null
 */
function getCurrentInputGroup(elmt: ArrowKeyElement) : string|null {
    const inputGroups = getOptionalStyle(elmt, 'data-input-groups');
    if (!inputGroups) {
        return null;
    }
    const groups = inputGroups.split(' ');
    if (currentInputGroup) {
        if (groups.indexOf(currentInputGroup) >= 0) {
            return currentInputGroup;
        }
        let prevPrefix = currentInputGroup.split(':')[0];
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].split(':')[0] == prevPrefix) {
                return groups[i];
            }
        }

    }
    return groups[0];
}

/**
 * Set which element group the user is inputting into.
 * An element can be part of multiple groups. Usually, associated with differing directions.
 * If the same element is selected repeatedly, rotate among the associated groups.
 * @param elmt The element with the selection
 */
export function setCurrentInputGroup(elmt: ArrowKeyElement) {
    let newGroup:string|null = null;
    if (inputGroupElement != elmt) {
        // Moving group focus to this element
        newGroup = getCurrentInputGroup(elmt);
    }
    else {
        // Repeat focus this element
        const inputGroups = getOptionalStyle(elmt, 'data-input-groups');
        if (inputGroups) {
            const groups = inputGroups.split(' ');
            let index = groups.indexOf(currentInputGroup || '');
            index = (index + 1) % groups.length;
            newGroup = groups[index];
        }
    }
    if (newGroup != currentInputGroup) {
        removeClassGlobally('input-group');
        if (newGroup) {
            const members = getInputGroupMembers(newGroup);
            for (let i = 0; i < members.length; i++) {
                toggleClass(members[i], 'input-group', true);
            }
        }
        currentInputGroup = newGroup;
    }
    inputGroupElement = newGroup ? elmt : null;
}

const oppositeDirectionPrefix: {[key: string]: string} = {
    'u': 'd',
    'd': 'u',
    'l': 'r',
    'r': 'l'
};

/**
 * When in an element group, arrow keys have additional meanings.
 * Arrow keys aligned with the group direction move within the group.
 * Arrow keys aligned with an alternate direction can indicate a different group.
 * In that case, switch groups, but do not move.
 * If the arrow does not match an alternate direction, simply move.
 * @param elmt The element with the selection
 * @param key The key that was pressed from within that element
 * @returns True if the arrow only switches group. False if it moves the selection.
 */
export function arrowFromInputGroup(elmt: ArrowKeyElement, code:string):boolean {
    if (!currentInputGroup) {
        return false;
    }
    let prevPrefix = currentInputGroup.split(':')[0];
    if (!prevPrefix) {
        return false;  // Current group doesn't use directions
    }

    if (!code.startsWith('Arrow')) {
        return false;
    }
    let dirPrefix = code.substring(5, 6).toLowerCase();
    if (!(dirPrefix in oppositeDirectionPrefix)) {
        return false;  // ?!
    }

    if (prevPrefix[0] == dirPrefix) {
        // Arrow is consistent with group direction
        return false;  // Let normal movement do its thing
    }
    if (prevPrefix[0] == oppositeDirectionPrefix[dirPrefix]) {
        // Arrow is consistent with group direction
        return false;  // Let normal movement do its thing
    }

    // Look for an alternate group
    const inputGroups = getOptionalStyle(elmt, 'data-input-groups') || '';
    const groups = inputGroups.split(' ');
    for (let i = 0; i < groups.length; i++) {
        const groupName = groups[i];
        let parts = groupName.split(':');
        if (parts.length > 1) {
            if (parts[0][0] == dirPrefix) {
                // TODO: switch groups, don't move
                removeClassGlobally('input-group');
                const members = getInputGroupMembers(groupName);
                for (let i = 0; i < members.length; i++) {
                    toggleClass(members[i], 'input-group', true);
                }
                currentInputGroup = groupName;
                return true;
            }
        }
    }

    return false;
}

/**
 * Get the part of an input group name that should be consistent for all members of the group.
 * @param group An input group name
 * @returns That string, or a substring.
 */
function comparableGroupName(group:string) {
    let parts = group.split(':');
    if (parts.length > 2) {
        // A group name can have a trailing index, which will differ
        group = `${parts[0]}:${parts[1]}`;
    }
    return group;
}

/**
 * Does a given element consider itself to be part of this named input group?
 * @param elmt An element to test, which may be in 0, 1, or more groups.
 * @param groupName An input group name to match, or if omitted, any group
 * @returns true if any of this elements groups matches the target group
 */
export function hasInputGroup(elmt: Element, groupName: string|undefined = undefined): boolean {
    const inputGroups = getOptionalStyle(elmt, 'data-input-groups');
    if (inputGroups) {
        if (!groupName) {
            return true;
        }
        groupName = comparableGroupName(groupName);
        const groups = inputGroups.split(' ');
        for (let i = 0; i < groups.length; i++) {
            if (comparableGroupName(groups[i]) == groupName) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Find all members of a given input group, anywhere on the page.
 * @param group The name of an input group
 * @param cls A class to constrain to, or undefined to search all ArrowKeyElements
 * @returns A list of elements.
 */
function getInputGroupMembers(group: string, 
                            cls: string|undefined = undefined,
                            clsSkip: string|undefined = undefined): ArrowKeyElement[] {
    const members:ArrowKeyElement[] = [];
    if (cls) {
        const elmts = document.getElementsByClassName(cls);
        for (let i = 0; i < elmts.length; i++) {
            if (!hasClass(elmts[i], clsSkip) && hasInputGroup(elmts[i], group)) {
                members.push(elmts[i] as ArrowKeyElement);
            }
        }
        return members;
    }
    const tagNames = ['input', 'textarea', 'select', 'button'];
    for (let t = 0; t < tagNames.length; t++) {
        const elmts = document.getElementsByTagName(tagNames[t]);
        for (let i = 0; i < elmts.length; i++) {
            if (hasInputGroup(elmts[i], group)) {
                members.push(elmts[i] as ArrowKeyElement);
            }
        }
    }
    return members;
}

/**
 * Given the name of an input group, what is the default horizontal movement?
 * @param groupName A string which may contain a direction prefix, i.e. 'x:name'
 * @returns The horizontal component indicated by that prefix. 
 * Or if no prefix, the normal text direction of the puzzle.
 * @remarks Valid horizontal prefixes are r|l|h (right|left|horizontal), which can be 
 * paired with d|u|v for diagonal.
 */
function dxFromGroup(groupName: string): number {
    const parts = groupName.split(':');
    if (parts.length <= 1) {
        return plusX;
    }
    const pref = parts[0].toLowerCase();
    if (pref.indexOf('r') >= 0) { return 1; }
    if (pref.indexOf('l') >= 0) { return -1; }
    if (pref.indexOf('h') >= 0) { return plusX; }
    return 0;
}

/**
 * Given the name of an input group, what is the default vertical movement?
 * @param groupName A string which may contain a direction prefix, i.e. 'x:name'
 * @returns The vertical component indicated by that prefix. 
 * Or if no prefix, the normal text direction of the puzzle (usually horizontal).
 * @remarks Valid vertical prefixes are d|u|v (down|up|vertical), which can be 
 * paired with r|l|h for diagonal.
 */
function dyFromGroup(groupName: string): number {
    const parts = groupName.split(':');
    if (parts.length <= 1) {
        return 0;
    }
    const pref = parts[0].toLowerCase();
    if (pref.indexOf('d') >= 0) { return 1; }
    if (pref.indexOf('u') >= 0) { return -1; }
    if (pref.indexOf('v') >= 0) { return plusX; }
    return 0;
}

/**
 * If starting element is in a group, find the next element forward or backward within the group.
 * @param start The current element
 * @param fwd Whether moving forward (by typing) or backwards (backspace)
 * @param wrap If set, and if no element in the desired direction wrap around to other end.
 * @param cls A subset of elements to filter within
 * @returns 
 */
function findNextGroupInput(start: ArrowKeyElement,
                            fwd: boolean,
                            wrap: boolean,
                            cls: string|undefined = undefined,
                            clsSkip: string|undefined = undefined)
                            : ArrowKeyElement|null {
    const groupName = getCurrentInputGroup(start);
    if (!groupName) {
        return null;
    }

    let dx = dxFromGroup(groupName);
    let dy = dyFromGroup(groupName);
    if (dx == 0 && dy == 0) {
        // TODO: 0/0 will mean indexed
        // Group names will have an index suffix (i.e. 'grp:1')
        // Forward means climb the index
        console.error(`Input group "${groupName}" has unrecognized direction prefix.`);
        return null;
    }
    if (!fwd) {
        dx = -dx;
        dy = -dy;
    }

    const elements = getInputGroupMembers(groupName, cls, clsSkip);
    let next:ArrowKeyElement|null = null;
    for (let i = 0; i < elements.length; i++) {
        const elmt = elements[i];
        if (compareHorizontal(elmt, start) == dx && compareVertical(elmt, start) == dy) {
            if (!next || (compareHorizontal(elmt, next) == -dx && compareVertical(elmt, next) == -dy)) {
                next = elmt;
            }
        }
    }

    if (!next && wrap) {
        for (let i = 0; i < elements.length; i++) {
            const elmt = elements[i];
            if (!next || (compareHorizontal(elmt, next) == -dx && compareVertical(elmt, next) == -dy)) {
                next = elmt;
            }
        }
    }

    return next;
}

/**
 * Some functions want to flexibly pull values from various constructs:
 *   - input elements
 *   - containers of multiple input elements
 * Extract an appropriate value to submit
 * @param container The container of the text value.
 * @param eachBlank The value to concatenate for each blank inputs.
 * @returns The value, or concatenation of values.
 */
export function getValueFromTextContainer(container:HTMLElement, eachBlank:string):string {
    // If the extraction has alredy been cached, use it
    // If container is an input, get its value
    if (isTag(container, 'input')) {
        return (container as HTMLInputElement).value;
    }
    if (isTag(container, 'textarea')) {
        return (container as HTMLTextAreaElement).value;
    }
    // If we contain multiple inputs, concat them
    let inputs = container.getElementsByClassName('letter-input');
    if (inputs.length == 0) {
        inputs = container.getElementsByClassName('word-input');
    }
    if (inputs.length > 0) {
        let value = '';
        for (let i = 0; i < inputs.length; i++) {
            if (!hasClass(inputs[i], 'letter-non-input')) {
                const ch = (inputs[i] as HTMLInputElement).value;
                value += ch || eachBlank;
            }
        }
        return value;
    }
    // If we contain multiple other extractions, concat them
    const datas = getAllElementsWithAttribute(container, 'data-extraction');
    if (datas.length > 0) {
        let value = '';
        for (let i = 0; i < datas.length; i++) {
            value += datas[i].getAttribute('data-extraction');
        }
        return value;
    }
    // If we are just a destination div, the value will be cached
    const cached = container.getAttribute('data-extraction');
    if (cached != null) {
        return cached;
    }
    // No recognized combo
    console.error('Unrecognized value container: ' + container);
    return '';
}
