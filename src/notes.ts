import { isBodyDebug, isPrint, theBoiler } from "./boilerplate";
import { hasClass, toggleClass,     
    moveFocus, findNextOfClass, findParentOfClass, getOptionalStyle } from "./classUtil";
import { indexAllNoteFields, indexAllCheckFields, indexAllHighlightableFields, 
    saveNoteLocally, saveCheckLocally, saveHighlightLocally } from "./storage"

/***********************************************************
 * NOTES.TS
 * Utilities for multiple kinds of annotations on a puzzle
 *  - Text fields near objects, to take notes
 *  - Check marks near objects, to show they've been used
 *  - Highlighting of objects
 * Each kind of annotation is optional. It can be turned on
 * in a puzzle's metadata. 
 */

/**
 * Define an optional callback.
 * A puzzle document may define a function with this name, and will get called at the end of setup.
 */
let initGuessFunctionality: any;

// Dead code?
// function simpleSetup(load) {
//     if (typeof initGuessFunctionality === 'function') {
//         initGuessFunctionality();
//     }
// }

/**
 * Look for elements tagged with any of the implemented "notes" classes.
 * Each of these will end up with a notes input area, near the owning element.
 * Note fields are for players to jot down their thoughts, before comitting to an answer.
 */
export function setupNotes(margins:HTMLDivElement) {
    let index = 0;
    index = setupNotesCells('notes-above', 'note-above', index);
    index = setupNotesCells('notes-below', 'note-below', index);
    index = setupNotesCells('notes-right', 'note-right', index);
    index = setupNotesCells('notes-left', 'note-left', index);
    // Puzzles can use the generic 'notes' class if they have their own .note-input style
    index = setupNotesCells('notes', undefined, index);
    index = setupNotesCells('notes-abs', undefined, index);
    setupNotesToggle(margins);
    indexAllNoteFields();
    if (isPrint()) {
        setNoteState(NoteState.Disabled);
    }
    else if (isBodyDebug()) {
        setNoteState(NoteState.Visible);
    }
}

/**
 * Find all objects tagged as needing notes, then create a note cell adjacent.
 * @param findClass The class of the puzzle element that wants notes
 * @param tagInput The class of note to create
 * @param index The inde of the first note
 * @returns The index after the last note
 */
function setupNotesCells(findClass:string, tagInput:string|undefined, index:number) {
    var cells = document.getElementsByClassName(findClass);
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];

        // Place a small text input field in each cell
        let inp = document.createElement('input');
        inp.type = 'text';
        inp.classList.add('note-input');
        if (hasClass(cell, 'numeric')) {
            // Trigger the mobile numeric keyboard
            inp.pattern = '[0-9]*';  // iOS
            inp.inputMode = 'numeric';  // Android
        }
        if (tagInput != undefined) {
            inp.classList.add(tagInput);
        }
        inp.onkeyup=function(e){onNoteArrowKey(e)};
        inp.onchange=function(e){onNoteChange(e)};
        cell.appendChild(inp);
    }
    return index;
}

/**
 * Custom nabigation key controls from within notes
 * @param event The key event
 */
function onNoteArrowKey(event:KeyboardEvent) {
    if (event.isComposing || event.currentTarget == null) {
        return;  // Don't interfere with IMEs
    }

    const input = event.currentTarget as Element;
    let code = event.code;
    if (code == 'Enter') {
        code = event.shiftKey ? 'ArrowUp' : 'ArrowDown';
    }
    if (code == 'ArrowUp' || code == 'PageUp') {
        moveFocus(findNextOfClass(input, 'note-input', undefined, -1) as HTMLInputElement);
        return;
    }
    else if (code == 'Enter' || code == 'ArrowDown' || code == 'PageDown') {
        moveFocus(findNextOfClass(input, 'note-input') as HTMLInputElement);
        return;
    }
    noteChangeCallback(input as HTMLInputElement);
}

/**
 * Each time a note is modified, save
 * @param event The change event
 */
function onNoteChange(event:Event) {
    if (event.target == null || (event.type == 'KeyboardEvent' && (event as KeyboardEvent).isComposing)) {
        return;  // Don't interfere with IMEs
    }

    const input = event.currentTarget as Element;
    const note =  findParentOfClass(input, 'note-input') as HTMLInputElement;
    saveNoteLocally(note);
    noteChangeCallback(note);
}

/**
 * Anytime any note changes, inform any custom callback
 * @param inp The affected input
 */
function noteChangeCallback(inp: HTMLInputElement) {
    const fn = theBoiler().onNoteChange;
    if (fn) {
        fn(inp);
    }
}

/**
 * Notes can be toggled on or off, and when on, can also be lit up to make them easier to see.
 */
var NoteState = {
    Disabled: -1,
    Unmarked: 0,
    Visible: 1,
    Subdued: 2,  // Enabled but not highlighted
    MOD: 3,
};

/**
 * The note visibility state is tracked by a a class in the body tag.
 * @returns a NoteState enum value
 */
function getNoteState() {
    var body = document.getElementsByTagName('body')[0];
    if (hasClass(body, 'show-notes')) {
        return NoteState.Visible;
    }
    if (hasClass(body, 'enable-notes')) {
        return NoteState.Subdued;
    }
    return hasClass(body, 'disabled-notes') ? NoteState.Disabled : NoteState.Unmarked;
}

/**
 * Update the body tag to be the desired visibility state
 * @param state A NoteState enum value
 */
function setNoteState(state:number) {
    var body = document.getElementsByTagName('body')[0];
    toggleClass(body, 'show-notes', state == NoteState.Visible);
    toggleClass(body, 'enable-notes', state == NoteState.Subdued);
    toggleClass(body, 'disable-notes', state == NoteState.Disabled);
}

/**
 * There is a Notes link in the bottom corner of the page.
 * Set it up such that clicking rotates through the 3 visibility states.
 * @param margins the parent of the toggle UI
 */
function setupNotesToggle(margins:HTMLDivElement|null) {
    let toggle = document.getElementById('notes-toggle') as HTMLAnchorElement;
    if (toggle == null && margins != null) {
        toggle = document.createElement('a');
        toggle.id = 'notes-toggle';
        margins.appendChild(toggle);
    }
    const state = getNoteState();
    if (state == NoteState.Disabled || state == NoteState.Unmarked) {
        toggle.innerText = 'Show Notes';
    }
    else if (state == NoteState.Visible) {
        toggle.innerText = 'Dim Notes';
    }
    else {  // state == NoteState.Subdued
        // toggle.innerText = 'Disable Notes';
        toggle.innerText = 'Un-mark Notes';
    }
    toggle.href = 'javascript:toggleNotes()';
}

/**
 * Rotate to the next note visibility state.
 */
export function toggleNotes() {
    const state = getNoteState();
    setNoteState((state + 1) % NoteState.MOD);
    setupNotesToggle(null);
}


/**
 * Elements tagged with class = 'cross-off' are for puzzles clues that don't indicate where to use it.
 * Any such elements are clickable. When clicked, a check mark is toggled on and off, allowed players to mark some clues as done.
 */
export function setupCrossOffs() {
    const cells = document.getElementsByClassName('cross-off');
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i] as HTMLElement;

        // Place a small text input field in each cell
        cell.onclick=function(e){onCrossOff(e)};

        var check = document.createElement('span');
        check.classList.add('check');
        //check.innerHTML = '&#x2714;&#xFE0F;' // âœ”ï¸;
        cell.appendChild(check);
    }
    indexAllCheckFields();
}

/**
 * Handler for when an object that can be crossed off is clicked
 * @param event The mouse event
 */
function onCrossOff(event:MouseEvent) {
    if (event.ctrlKey || event.shiftKey || event.altKey) {
        return;  // Do nothing in shift states
    }
    let obj = event.target as HTMLElement;
    if (obj.tagName == 'A' || hasClass(obj, 'note-input') || hasClass(obj, 'letter-input') || hasClass(obj, 'word-input')) {
        return;  // Clicking on lines, notes, or inputs should not check anything
    }
    let parent = findParentOfClass(obj, 'cross-off') as HTMLElement;
    if (parent != null) {
        const newVal = !hasClass(parent, 'crossed-off');
        toggleClass(parent, 'crossed-off', newVal);
        saveCheckLocally(parent, newVal);
    }
}

export function setupHighlights() {
    const highlight = document.getElementById('highlight-ability');
    if (highlight != null) {
        highlight.onmousedown = function() {toggleHighlight()};
    }

    const containers = document.getElementsByClassName('highlight-container');
    for (let i = 0; i < containers.length; i++) {
        const container = containers[i] as HTMLElement;
        const rules = getOptionalStyle(container, 'data-highlight-rules');
        if (rules) {
            const list = rules.split(' ');
            for (let r = 0; r < list.length; r++) {
                const rule = list[r];
                if (rule[0] == '.') {
                    const children = container.getElementsByClassName(rule.substring(1));
                    for (let i = 0; i < children.length; i++) {
                        toggleClass(children[i], 'can-highlight', true);
                    }
                }
                else if (rule[0] == '#') {
                    const child = document.getElementById(rule.substring(1));
                    toggleClass(child, 'can-highlight', true);
                }
                else {
                    const children = container.getElementsByTagName(rule.toLowerCase());
                    for (let i = 0; i < children.length; i++) {
                        toggleClass(children[i], 'can-highlight', true);
                    }
                }
            }
        }
    }

    const cans = document.getElementsByClassName('can-highlight');
    for (let i = 0; i < cans.length; i++) {
        const can = cans[i] as HTMLElement;
        can.onclick = function(e) { onClickHighlight(e);};
    }

    // Index will now include all children from above expansion rules
    indexAllHighlightableFields();
}

/**
 * If an element can be highlighted, toggle that highlight on or off
 * @param elmt The element to highlight
 */
export function toggleHighlight(elmt?:HTMLElement) {
    if (elmt == undefined) {
        elmt = document.activeElement as HTMLElement;  // will be body if no inputs have focus
    }
    const highlight = findParentOfClass(elmt, 'can-highlight') as HTMLElement;
    if (highlight) {
        toggleClass(highlight, 'highlighted');
        saveHighlightLocally(highlight);
    }
}

/**
 * Clicking on highlightable elements can toggle their highlighting.
 * If they are not input elements, a simple click works.
 * If they are inputs, user must ctrl+click.
 * @param evt The mouse event from the click
 */
function onClickHighlight(evt:MouseEvent) {
    const elem = document.elementFromPoint(evt.clientX, evt.clientY) as HTMLElement;
    if (elem) {
        if (elem.tagName != 'INPUT' || evt.ctrlKey) {
            toggleHighlight(elem);
        }    
    }
}

