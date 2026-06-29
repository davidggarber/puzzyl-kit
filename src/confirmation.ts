import { theBoiler } from "./boilerplate";
import { consoleTrace } from "./builder";
import { getOptionalStyle, isTag, toggleClass } from "./classUtil";
import { EventSyncActivity, pingEventServer } from "./eventSync";
import { scanMetaMaterials } from "./meta";
import { PuzzleStatus, getCurFileName, saveGuessHistory, updatePuzzleList } from "./storage";
import { getValueFromTextContainer } from "./textInput";

/**
 * Response codes for different kinds of responses
 */
const ResponseType = {
    Error: 0,
    Correct: 1,  // aka solved
    Confirm: 2,  // confirm an intermediate step
    KeepGoing: 3,// a wrong guess that deserves a hint
    Unlock: 4,   // offer players a link to a hidden page
    Load: 5,     // load another page in a hidden iframe
    Show: 6,     // cause another cell to show
//    Save: 7,     // write a key/value directly to storage
};

/**
 * CSS classes for each response type
 */
const ResponseTypeClasses = [
    'rt-error',
    'rt-correct',
    'rt-confirm',
    'rt-keepgoing',
    'rt-unlock',
    'rt-load',
//    'rt-save',
];

/**
 * The generic response for unknown submissions
 */
const no_match_response = "0";

/**
 * Default response text, if the validation block only specifies a type
 */
const default_responses = [
    "Incorrect",    // Error
    "Correct!",     // Correct
    "Confirmed",    // Confirmation
    "Keep going",   // Keep Going
];

/**
 * img src= URLs for icons to further indicate whether guesses were correct or not
 */
const response_img = [
    "../Icons/X.png",         // Error
    "../Icons/Check.png",     // Correct
    "../Icons/Thumb.png",     // Confirmation
    "../Icons/Thinking.png",  // Keep Going
    "../Icons/Unlocked.png",  // Unlock
];

/**
 * A single guess submitted by a player, noting also when it was submitted
 */
export type GuessLog = {
    field: string;  // Which field did the user guess on
    guess: string;  // What the user guessed
    time: Date;     // When the guess was submitted
};

/**
 * The full history of guesses on the current puzzle
 */
let guess_history:GuessLog[] = [];

/**
 * This puzzle has a validation block, so there must be either a place for the
 * player to propose an answer, or an automatic extraction for other elements.
 */
export function setupValidation() {
    const body = document.getElementsByTagName('body')[0];
    if (body) {
        toggleClass(body, 'show-validater', true);
    }
    const buttons = document.getElementsByClassName('validater');
    if (buttons.length > 0) {
        let hist = getHistoryDiv('');
        if (!hist) {
            // Create a standard <div id="guess-log"> to track the all guesses
            const log = document.createElement('div');
            log.id = 'guess-log';
            const div = document.createElement('div');
            div.id = 'guess-history';
            const span = document.createElement('span');
            span.id = 'guess-titlebar';
            span.appendChild(document.createTextNode('Submissions'));
            log.appendChild(span);
            log.appendChild(div);
            document.getElementById('pageBody')?.appendChild(log);
        }
    }
    for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i] as HTMLElement;
        if (isTag(btn, 'button')) {
            btn.onclick=function(e){clickValidationButton(e.target as HTMLButtonElement)};
            const srcId = getOptionalStyle(btn, 'data-extracted-id') || 'extracted';
            let src = document.getElementById(srcId);
            // If button is connected to a text field, hook up ENTER to submit
            if (src && isTag(src, 'span')) {
                // We might be associated with a readonly extracted pattern, or with an input. 
                // For the latter, we likely have a word-cell or letter-cell parent of the actual input
                const inps = src.getElementsByTagName('input');
                if (inps && inps.length == 1) {
                    src = inps[0];
                }
            }
            if (src && ((isTag(src, 'input') && (src as HTMLInputElement).type == 'text')
                        || isTag(src, 'textarea'))) {  // TODO: not multiline
                src.onkeyup=function(e){validateInputReady(btn as HTMLButtonElement, e.key)};
            }
            // Usually, disable/hide the button at first
            validateInputReady(btn as HTMLButtonElement, null);
        }
    }
}

function calculateTextExtents(src:HTMLElement, value:string):number {
    let fe = document.getElementById('fontExtents');
    if (!fe) {
        fe = document.createElement('span');
        fe.id = 'fontExtents';
        fe.style.position = 'absolute';
        document.getElementsByTagName('body')[0].appendChild(fe);
    }

    fe.innerText = value;
    const styles = window.getComputedStyle(src, null);
    fe.style.fontFamily = styles.getPropertyValue('font-family');
    fe.style.fontSize = styles.getPropertyValue('font-size');
    fe.style.fontWeight = styles.getPropertyValue('font-weight');
    fe.style.fontStretch = styles.getPropertyValue('font-stretch');
    fe.style.textTransform = styles.getPropertyValue('text-transform');
//    fe.style.transform = styles.getPropertyValue('transform');
    return fe.scrollWidth;
}

/**
 * When a user types an over-long value into an input, shrink the font
 * @param input An input or textarea element
 * @param value The current text
 */
function horzScaleToFit(input:HTMLElement, value:string) {
    let widthPx = parseFloat(input.getAttribute('data-original-width') || '');
    if (!widthPx) {
        widthPx = calcPxStyle(input, 'width');
        input.setAttribute('data-original-width', '' + widthPx);
    }
    if (value.length == 0) {
        input.style.transform = 'scale(100%, 100%)';
        input.style.width = widthPx + 'px';
    }
    const curScale = calcTransform(input, 'scale', matrix.scaleX, 1);
    const needPx = calculateTextExtents(input, value + '|');  // account for borders
    if (needPx * curScale > widthPx) {
        const wantPx = calculateTextExtents(input, value + ' 12345678');  // one more word
        const newScalePct = Math.floor(widthPx * 100 / wantPx);
         if (newScalePct > 33) {  // Maximum compression before unreadable
            input.style.transformOrigin = 'left';
            input.style.transform = 'scale(' + newScalePct + '%, 100%)';
            input.style.width = Math.floor(widthPx * 100 / newScalePct) + 'px';
        }
        const test = calculateTextExtents(input, value);
    }
    else if (input.style.transform.indexOf('scale') == 0 && needPx < widthPx) {
        input.style.transformOrigin = 'left';
        input.style.transform = 'initial';
        input.style.width = widthPx + 'px';
    }
}

function calcPxStyle(elmt:HTMLElement, prop:string):number {
    const val = window.getComputedStyle(elmt, null).getPropertyValue(prop);
    return parseFloat(val.substring(0, val.length - 2));  // px
}

function calcPctStyle(elmt:HTMLElement, prop:string):number {
    const val = window.getComputedStyle(elmt, null).getPropertyValue(prop);
    return parseFloat(val.substring(0, val.length - 1));  // %
}

const matrix = {
    scaleX: 0,
    rotX: 1,
    rotY: 2,
    scaleY: 3,
    translateX: 4,
    translateY: 5
}

function calcTransform(elmt:HTMLElement, prop:string, index:number, defValue:number):number {
    const trans = window.getComputedStyle(elmt, null).getPropertyValue('transform');
    let matrix = '1, 0, 0, 0, 1, 0';  // unit transform
    if (trans && trans.substring(0, 7) == 'matrix(') {
        matrix = trans.substring(7, trans.length - 8);
    }
    const split = matrix.split(',');
    if (index < split.length) {
        const val = split[index];
        if (val.substring(val.length - 1) == '%') {
            return parseFloat(val.substring(0, val.length - 1)) * 0.01;
        }
        else if (val.substring(val.length - 2) == 'px') {
            return parseFloat(val.substring(0, val.length - 2));
        }
        else return parseFloat(val);
    }
    return defValue;
}


/**
 * When typing in an input connected to a validate button,
 * any non-empty string indicates ready (TODO: add other rules)
 * and ENTER triggers a button click
 * @param btn The button to enable/disable as ready
 * @param key What key was just typed, if any
 */
export function validateInputReady(btn:HTMLButtonElement, key:string|null) {
    const id = getOptionalStyle(btn, 'data-extracted-id', 'extracted');
    const ext = id ? document.getElementById(id) : null;
    if (!ext) {
        console.error('Button ' + btn.id + ' missing a valid "data-extracted-id" linking to its source: ' + id);
        return;
    }
    const value = getValueFromTextContainer(ext, '_');
    const ready = isValueReady(btn, value);
    consoleTrace(`Value ${value} is ${ready ? "" : "NOT "} ready`);

    toggleClass(btn, 'ready', ready);
    if (ready && (key == 'Enter' || key == 'NumpadEnter')) {
        clickValidationButton(btn as HTMLButtonElement); 
    }
    else if (isTag(ext, 'input') || isTag(ext, 'textarea')) {
        horzScaleToFit(ext, value);
    }
}

/**
 * Is this value complete, such that submitting is possible?
 * @param btn The button to submit
 * @param value The value to submit
 * @returns true if the value is long enough and contains no blanks
 */
function isValueReady(btn:HTMLButtonElement, value:string|null):boolean {
    if (!value) {
        return false;
    }
    if (value.indexOf('_') >= 0) {
        return false;
    }
    const minLength = getOptionalStyle(btn, 'data-min-length')
    if (minLength) {
        return value.length >= parseInt(minLength);
    }
    return value.length > 0;
}

/**
 * There should be a singleton guess history, which we likely created above
 * @param id The ID, or 'guess-history' by default
 */
function getHistoryDiv(id:string): HTMLDivElement {
    return document.getElementById('guess-history') as HTMLDivElement;
}

/**
 * The user has clicked a "Submit" button next to their answer.
 * @param btn The target of the click event
 * The button can have parameters pointing to the extraction.
 */
function clickValidationButton(btn:HTMLButtonElement) {
    const id = getOptionalStyle(btn, 'data-extracted-id', 'extracted');
    if (!id) {
        return;
    }
    const ext = document.getElementById(id);
    if (!ext) {
        return;
    }

    const value = getValueFromTextContainer(ext, '_');
    const ready = isValueReady(btn, value);

    if (ready) {
        const now = new Date();
        const gl:GuessLog = { field:id, guess: value, time: now };
        decodeAndValidate(gl);
    }
}

/**
 * Validate a user's input against the encoded set of validations
 * @param gl the guess information, but not the response
 */
export function decodeAndValidate(gl:GuessLog) {
    consoleTrace(`Guess ${gl.guess}`);
    const validation = theValidation();
    if (!validation) {
        console.error('No validation data');
        return;
    }
    let field = gl.field;
    if (!(field in validation) && ('' in validation)) {
        // Most puzzles have a single validated field, and so don't need to name it
        field = '';
    }
    if (field in validation) {
        const obj = validation[field];

        // Normalize guesses
        // TODO: make this optional, in theBoiler, if a puzzle needs
        // Alternatively, go a step further, and de-accent characters
        gl.guess = gl.guess.toUpperCase();  // All caps (permanent)
        let guess = gl.guess.replace(/[^a-zA-Z0-9]/g, '');  // Remove everything that isn't alphanumeric

        const hash = rot13(guess);  // TODO: more complicated hashing
        const block = appendGuess(gl);
        let solved = false;
        if (hash in obj) {
            const encoded = obj[hash];
    
            // Guess was expected. It may have multiple responses.
            const multi = encoded.split('|');
            for (let i = 0; i < multi.length; i++) {
                solved = appendResponse(block, multi[i]) || solved;
            }
        }
        else {
            // Guess does not match any hashes
            appendResponse(block, no_match_response);
        }
        pingEventServer(solved ? EventSyncActivity.Solve : EventSyncActivity.Attempt, guess);
    }
    else {
        console.error('Unrecognized validation field: ' + gl.field);
    }
}

/**
 * Build a guess/response block, initialized with the guess
 * @param gl The user's guess info
 * @returns The block, to which responses can be appended
 */
function appendGuess(gl:GuessLog): HTMLDivElement {
    // Save
    guess_history.push(gl);
    saveGuessHistory(guess_history);

    // Build a block for the guess and any connected responses
    const hist = getHistoryDiv(gl.field);
    const block = document.createElement('div');
    block.classList.add('rt-block');

    const div = document.createElement('div');
    div.classList.add('rt-guess');
    div.appendChild(document.createTextNode(gl.guess));

    const now = gl.time;
    const time = now.getHours() + ":" 
        + (now.getMinutes() < 10 ? "0" : "") + now.getMinutes() + ":"
        + (now.getSeconds() < 10 ? "0" : "") + now.getSeconds();
    const span = document.createElement('span');
    span.classList.add('rt-time');
    span.appendChild(document.createTextNode(time));
    div.appendChild(span);
    block.appendChild(div);

    // Newer guesses are inserted at the top
    hist.insertAdjacentElement('afterbegin', block);
    return block;
}

/**
 * Append a response to a guess block.
 * @param block The div containing the guess, and any other responses to the same guess
 * @param response The response, prefixed with the response type
 * The type is pulled off, and dictates the formatting.
 * Some types have side-effects, in addition to text.
 * If the response is only the type, pre-canned text is used instead.
 * @returns true if the response indicates the puzzle has been fully solved
 */
function appendResponse(block:HTMLDivElement, response:string):boolean {
    const type = parseInt(response[0]);
    response = response.substring(1);
    if (response.length == 0 && type < default_responses.length) {
        response = default_responses[type];
    }
    else {
        response = rot13(response);
    }

    const div = document.createElement('div');
    div.classList.add('response');
    div.classList.add(ResponseTypeClasses[type]);

    if (type == ResponseType.Unlock) {
        // Create a link to a newly unlocked page.
        // The (decrypted) response is either just a URL, 
        // or else URL^Friendly (separated by a caret)
        const caret = response.indexOf('^');
        const friendly = caret < 0 ? response : response.substring(caret + 1);
        if (caret >= 0) {
            response = response.substring(0, caret);

            // Keep any url args
            var urlArgs = (window.location.search ?? "?").substring(1);
            if (urlArgs) {
                if (response.indexOf('?') >= 0) {
                    response += '&' + urlArgs;
                }
                else {
                    response += '?' + urlArgs;
                }
            }
        }

        consoleTrace(`Unlocking ${response}` + (caret >= 0 ? `(aka ${friendly})` : ''));

        div.appendChild(document.createTextNode('You have unlocked '));
        const link = document.createElement('a');
        link.href = response;
        link.target = '_blank';
        link.appendChild(document.createTextNode(friendly));
        div.appendChild(link);


    }
    else if (type == ResponseType.Load) {
        consoleTrace(`Loading ${response}`);

        // Keep any url args
        var urlArgs = (window.location.search ?? "?").substring(1);
        if (urlArgs) {
            if (response.indexOf('?') >= 0) {
                response += '&' + urlArgs;
            }
            else {
                response += '?' + urlArgs;
            }
        }

        // Use an iframe to navigate immediately to the response URL.
        // The iframe will be hidden, but any scripts will run immediately.
        const iframe = document.createElement('iframe');
        iframe.src = response;
        div.appendChild(iframe);

        if (theBoiler().metaParams) {
            setTimeout(() => { scanMetaMaterials() }, 1000);
        }

    }
    else if (type == ResponseType.Show) {
        const parts = response.split('^');  // caret not allowed in a URL
        const elmt = document.getElementById(parts[0]);
        if (elmt) {
            if (parts.length > 1) {
                toggleClass(elmt, parts[1]);
            }
            else {
                elmt.style.display = 'block';
            }
        }
        else {
            console.error('Cannot show id=' + parts[0]);
        }
    }
    else {
        consoleTrace(`Validation response (type ${type}) : ${response}`);

        // The response (which may be canned) is displayed verbatim.
        div.appendChild(document.createTextNode(response));
    }

    if (type < response_img.length) {
        const img = document.createElement('img');
        img.classList.add('rt-img');
        img.src = response_img[type];
        div.appendChild(img);    
    }

    block.appendChild(div);
    setTimeout(() => { div.scrollIntoView({behavior:"smooth", block:"end"}) }, 100);

    if (type == ResponseType.Correct) {
        // Tag this puzzle as solved
        toggleClass(document.getElementsByTagName('body')[0], 'solved', true);
        // Cache that the puzzle is solved, to be indicated in tables of contents
        updatePuzzleList(getCurFileName(), PuzzleStatus.Solved);
        return true;
    }
    return false;
}

/**
 * Rot-13 cipher, maintaining case.
 * Chars other than A-Z are preserved as-is
 * @param source Text to be encoded, or encoded text to be decoded
 */
function rot13(source:string) {
    let rot = '';
    for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        let r = ch;
        if (ch >= 'A' && ch <= 'Z') {
            r = String.fromCharCode(((ch.charCodeAt(0) - 52) % 26) + 65);
        }
        else if (ch >= 'a' && ch <= 'z') {
            r = String.fromCharCode(((ch.charCodeAt(0) - 84) % 26) + 97);
        }
        rot += r;
    }
    return rot;
}

/**
 * Calculate the 256-bit (32-byte) SHA hash of any input string
 * @param source An input string
 * @returns A 32-character string
 */
// async function sha256(source) {
//     const sourceBytes = new TextEncoder().encode(source);
//     const digest = await window.crypto.subtle.digest("SHA-256", sourceBytes);
//     const resultBytes = [...new Uint8Array(digest)];
//     return resultBytes.map(x => x.toString(16).padStart(2, '0')).join("");
// }


declare let validation: Record<string, any> | undefined;

/**
 * We forward-declare boiler, which we expect calling pages to define.
 * @returns The page's boiler, if any. Else undefined.
 */
function pageValidation():Record<string, any> | undefined {
    // validation can be a standalone global variable, defined in another .js
    if (typeof validation !== 'undefined') {
        return validation as Record<string, any>;
    }
    // Or it can be a member of the boilerplate
    return theBoiler().validation;
}

let _validation: Record<string, any>|undefined;

/**
 * Expose the boilerplate as an export
 * Only called by code which is triggered by a boilerplate, so safely not null
 */
export function theValidation():Record<string, any>|undefined {
    if (!_validation)
        _validation = pageValidation();
    return _validation;
}
