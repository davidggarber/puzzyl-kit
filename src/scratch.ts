import { linkCss } from "./boilerplate";
import { hasClass, isTag, toggleClass } from "./classUtil";
import { eventRelIcon, getSafariDetails } from "./events";
import { saveScratches } from "./storage";

let scratchPad:HTMLDivElement|undefined = undefined;
let currentScratchInput:HTMLTextAreaElement|undefined = undefined;

/**
 * Setup a scratch pad that is the same size as the page.
 */
export function setupScratch() {
    const page = (document.getElementById('page')
        || document.getElementsByClassName('printedPage')[0])  as HTMLElement;
    if (!page) {
        return;
    }

    scratchPad = document.createElement('div');
    scratchPad.id = 'scratch-pad';

    scratchPad.addEventListener('click', function (e) { scratchPadClick(e); } );
    page.addEventListener('click', function (e) { scratchPageClick(e); } );
    window.addEventListener('blur', function (e) { scratchFlatten(null); } );

    page.insertAdjacentElement('afterbegin', scratchPad);

    if (getSafariDetails()) {
        linkCss(getSafariDetails()?.cssRoot + 'ScratchPad.css');
    }
}

/**
 * Click on the scratch pad (which is normally in the background).
 * If ctrl+click, start a new note.
 * Otherwise, flatten the current note.
 * @param evt 
 * @returns 
 */
function scratchClick(evt:MouseEvent) {
    if (!scratchPad) { return; }

    if (currentScratchInput && currentScratchInput !== evt.target) {
        scratchFlatten(evt);
    }

    if (evt.target && hasClass(evt.target as Node, 'scratch-div')) {
        scratchRehydrate(evt.target as HTMLDivElement);
        return;
    }
   
    if (!evt.ctrlKey) {
        // One way to leave scratch mode is to click away
        return;
    }

    const spRect = scratchPad.getBoundingClientRect();

    const div = document.createElement('div');
    toggleClass(div, 'scratch-div', true);
    currentScratchInput = document.createElement('textarea');

    // Position the new textarea where its first character would be at the click point
    div.style.left = (evt.clientX - spRect.left - 5) + 'px';  
    div.style.top = (evt.clientY - spRect.top - 10) + 'px';  
    currentScratchInput.style.width = Math.min(spRect.right - evt.clientX, spRect.width / 3) + 'px';
    disableSpellcheck(currentScratchInput);
    currentScratchInput.title = 'Escape to exit note mode';

    currentScratchInput.onkeyup = function(e) { scratchTyped(e); }

    toggleClass(scratchPad, 'topmost', true);
    div.appendChild(currentScratchInput);
    attachDragHandle(div);
    scratchPad.appendChild(div);
    currentScratchInput.focus();
}

/**
 * When the user clicks away, flatten
 * @param evt 
 */
function scratchPadClick(evt:MouseEvent) {
    if (!evt.ctrlKey) {
        if (scratchFromPoint(evt.clientX, evt.clientY) != currentScratchInput) {
            scratchFlatten(evt);
        }
    }
}

/**
 * Callback when the top-level page is clicked.
 * If it's a ctrl+click, try to create a scratch note at that point.
 * @param evt The mouse event
 */
function scratchPageClick(evt:MouseEvent) {
    if (evt.ctrlKey) {
        scratchFlatten(evt);
        const targets = document.elementsFromPoint(evt.clientX, evt.clientY);
        let underScratch = false;

        var div = scratchFromPoint(evt.clientX, evt.clientY);
        if (div && div != currentScratchInput) {
            scratchRehydrate(div as HTMLDivElement);
            return;    
        }

        // If the user clicked on an existing scratch div, rehydrate
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i] as HTMLElement;
            if (hasClass(target as Node, 'scratch-div')) {  // impossible, since pointer-events:none
                scratchRehydrate(target as HTMLDivElement);
                return;
            }
            if (hasClass(target, 'scratch-drag-handle')) {
                return;  // Let dragging happen
            }
            if (target.id === 'scratch-pad') {  // only possible when topmost, else pointer-events:none
                underScratch = true;
                continue;
            }
            if (isTag(target, 'a')) {
                if (underScratch) {
                    // The scratch pad is covering a link. Invoke it.
                    target.click();
                    return;
                }
            }

            if (isTag(target, ['input', 'textarea', 'select', 'a'])) {
                return;  // Don't steal clicks from form fields or links
            }
            if (hasClass(target, 'cross-off')) {
                continue;  // checkmarks react to click, not ctrl+click
            }
            if (target.id != 'page' && target.onclick) {
                return;  // Don't steal clicks from anything else with a click handler
            }
        }

        // We haven't deferred to other controls, so invoke scratch notes
        scratchClick(evt);

    }
}

/**
 * Does this point land inside the active scratch input, or any of the scratch-div regions?
 * @param x Client X
 * @param y Client Y
 * @returns The current textarea, any scratch-div, or null
 */
function scratchFromPoint(x:number, y:number):HTMLDivElement|HTMLTextAreaElement|null {
    if (currentScratchInput) {
        var rc = currentScratchInput.getBoundingClientRect();
        if (x >= rc.left && x <= rc.right && y >= rc.top && y <= rc.bottom) {
            return currentScratchInput;
        }
    }

    var divs = document.getElementsByClassName('scratch-div');
    for (var i = 0; i < divs.length; i++) {
        var div = divs[i];
        var rc = div.getBoundingClientRect();
        if (x >= rc.left && x <= rc.right && y >= rc.top && y <= rc.bottom) {
            return div as HTMLDivElement;
        }
    }
    return null;
}

/**
 * Disable all squigglies from the note surface. They are distracting.
 * @param elmt A newly created TextArea
 */
function disableSpellcheck(elmt:Element) {
    elmt.setAttribute('spellcheck', 'false');
    elmt.setAttribute('autocomplete', 'off');
    elmt.setAttribute('autocorrect', 'off');
    elmt.setAttribute('autocapitalize', 'off');
}

/**
 * Callback when the user types in the active textarea.
 * Ensures that the textarea stays correctly sized.
 * Exits scratch mode on Escape.
 * @param evt The keyboard event
 */
function scratchTyped(evt:KeyboardEvent) {
    if (!evt.target) {
        return;  // WTF?
    }
    if (evt.code == 'Escape') {
        scratchFlatten(null);
        return;
    }

    scratchResize(evt.target as HTMLTextAreaElement);
}

/**
 * Ensure that the active textarea is big enough for all its rows of text
 * @param ta The active textarea
 */
function scratchResize(ta: HTMLTextAreaElement) {
    const lines = 1 + (ta.value || '').split('\n').length;
    ta.setAttributeNS('', 'rows', lines.toString());
}

/**
 * Convert the active textarea to a flattened div
 * The textarea will be removed, and the text added directly to the div.
 */
function scratchFlatten(ev:Event|null) {
    if (!scratchPad || !currentScratchInput) { 
      return; 
    }

    const div = currentScratchInput.parentNode as HTMLDivElement;
    if (ev && div.contains(ev.target as Node)) {
        return;
    }

    toggleClass(scratchPad, 'topmost', false);

    // Avoid re-entrancy
    const ta = currentScratchInput;
    const text = ta!.value.trimEnd();
    currentScratchInput = undefined;

    const handle = div.getElementsByClassName('scratch-drag-handle')[0];
    if (handle) {
        div.removeChild(handle);
    }

    if (text) {
        const rect = ta.getBoundingClientRect();

        textIntoScratchDiv(text, div);
        const width = parseInt(ta!.style.width);
        div.style.maxWidth = width + 'px';
        div.style.maxHeight = rect.height + 'px';
        div.removeChild(ta!);
        toggleClass(div, 'hydrated', false);
    }
    else {
      // Remove the entire div
      div.parentNode?.removeChild(div);
    }

    scratchPad!.removeEventListener('dragover', allowDropOnScratchPad);

    saveScratches(scratchPad);
}

/**
 * Convert the <div> HTML contents to text appropriate for a textarea or storage
 * @param div A flattened scratch note
 * @returns A string of lines of notes with \n line breaks
 */
export function textFromScratchDiv(div:HTMLDivElement):string {
    let text = '';
    for (let i = 0; i < div.childNodes.length; i++) {
        const child = div.childNodes[i];
        if (child.nodeType == Node.TEXT_NODE) {
            text += (child as Text).textContent;
            text = text.replaceAll("  ", "  ");  // expand multiple spaces
        }
        else if (child.nodeType == Node.ELEMENT_NODE && isTag(child as Element, 'br')) {
            text += '\n';
        }
        else if (child.nodeType == Node.ELEMENT_NODE && isTag(child as Element, 'img')) {
            // Ignore drag handle
        }
        else {
            console.error('Unexpected contents of a scratch-div: ' + child);
        }
    }
    return text;
}

/**
 * Convert a flattened div back to a textarea in the same location
 * @param div A flattened div, which will be removed, and replaced
 */
function scratchRehydrate(div:HTMLDivElement) {
    if (!scratchPad || !hasClass(div, 'scratch-div')) {
        return;
    }

    toggleClass(div, 'hydrated', true);

    const ta = document.createElement('textarea');
    ta.value = textFromScratchDiv(div);
    ta.addEventListener('blur', function (e) { scratchFlatten(e); } );

    const rcSP = scratchPad.getBoundingClientRect();
    const rcD = div.getBoundingClientRect();

    // span.style.left = div.style.left;  
    // span.style.top = div.style.top;  
    ta.style.width = Math.min(rcSP.width / 3, rcSP.right - rcD.left) + 'px';
    disableSpellcheck(ta);
    ta.title = 'Escape to exit note mode';

    scratchResize(ta);
    ta.onkeyup = function(e) { scratchTyped(e); }

    toggleClass(scratchPad, 'topmost', true);

    while (div.childNodes.length > 0) {
        div.removeChild(div.childNodes[0]);
    }
    div.appendChild(ta);
    attachDragHandle(div);
    // div.parentNode!.append(ta);
    // div.parentNode!.removeChild(div);
    currentScratchInput = ta;
    ta.focus();
}

/**
 * Wipe away all scratches
 */
export function scratchClear() {
    if (!scratchPad) { return; }

    if (currentScratchInput) {
        currentScratchInput.parentNode!.removeChild(currentScratchInput);
        currentScratchInput = undefined;
    }
    const divs = scratchPad.getElementsByClassName('scratch-div');
    for (let i = divs.length - 1; i >= 0; i--) {
        scratchPad.removeChild(divs[i]);
    }
}

/**
 * Create a scratch div
 * @param x The client-x of the div
 * @param y The client-y of the div
 * @param width The (max) width of the div
 * @param height The (max) height of the div
 * @param text The text contents, as they would come from a textarea, with \n
 */
export function scratchCreate(x:number, y:number, width:number, height:number, text:string) {
    if (!scratchPad) { return; }

    if (text) {
        const div = document.createElement('div');
        toggleClass(div, 'scratch-div', true);

        textIntoScratchDiv(text, div);

        div.style.left = x + 'px';
        div.style.top = y + 'px';
        div.style.maxWidth = width + 'px';
        div.style.maxHeight = height + 'px';

        toggleClass(div, 'hydrated', true);

        scratchPad.append(div);
    }
}

/**
 * Convert a multi-line text string into a series of text nodes separated by <br>,
 * and inject those into a div.
 * @param text The raw text, with \n line breaks
 * @param div The destination div
 */
function textIntoScratchDiv(text:string, div:HTMLDivElement) {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
            div.appendChild(document.createElement('br'));
        }
        const spaced = lines[i].replaceAll("  ", "  ");  // multiple spaces would be lost
        div.appendChild(document.createTextNode(spaced));
        // console.log('flatten: ' + lines[i]);
    }
}

const allowDropOnScratchPad = (ev:DragEvent) => { ev.preventDefault(); };

function attachDragHandle(div:HTMLDivElement) {
    const handle = document.createElement('img');
    handle.src = eventRelIcon('ScratchMove.png');
    toggleClass(handle, 'scratch-drag-handle', true);
    div.appendChild(handle);

    const doScratchDrop = (ev:DragEvent) => dropScratchDiv(ev);
    
    div.setAttribute('draggable', 'true');
    div.addEventListener('dragstart', startDragScratch);
    div.addEventListener('dragend', endDragScratch);
    scratchPad!.addEventListener('dragover', allowDropOnScratchPad);

    let startX:number = 0;
    let startY:number = 0;
    let startLeft:number = 0;
    let startTop:number = 0;

    function startDragScratch(ev:DragEvent) {
        if (startX != 0) {
            console.error('Re-entrant drag!!');
        }
        toggleClass(div, 'dragging', true);
        startX = ev.clientX;
        startY = ev.clientY;
        startLeft = parseFloat(div.style.left);
        startTop = parseFloat(div.style.top);
        scratchPad!.addEventListener('drop', doScratchDrop);
        if (ev.dataTransfer) {
            ev.dataTransfer.effectAllowed = "move";
        }
    }
    
    function dropScratchDiv(ev:DragEvent) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        div.style.left = startLeft + dx + 'px';
        div.style.top = startTop + dy + 'px';
        startX = 0;
        startY = 0;
        currentScratchInput?.focus();
    }
    
    function endDragScratch(ev:DragEvent) {
        toggleClass(div, 'dragging', false);
        scratchPad!.removeEventListener('drop', doScratchDrop);
    }
}
