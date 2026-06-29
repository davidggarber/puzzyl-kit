import { forceReload, isIFrame, isRestart, theBoiler } from "./boilerplate";
import { hasClass, toggleClass, getOptionalStyle, findFirstChildOfClass, clearAllClasses, isTag, getAllClasses } from "./classUtil";
import { afterInputUpdate, updateWordExtraction } from "./textInput";
import { quickMove, quickFreeMove, Position, positionFromStyle } from "./dragDrop";
import { doStamp, getStampParent } from "./stampTools";
import { createFromVertexList } from "./straightEdge";
import { GuessLog, decodeAndValidate } from "./confirmation";
import { getSafariDetails } from "./events";
import { scratchClear, scratchCreate, textFromScratchDiv } from "./scratch";
import { EventSyncActivity, LoginInfo, pingEventServer } from "./eventSync";
import { consoleTrace } from "./builder";

////////////////////////////////////////////////////////////////////////
// Types
//

/**
 * Cache structure for of all collections that persist on page refresh
 */
type LocalCacheStruct = {
    letters:    {[key: number]: string};   // number => string
    words:      {[key: number]: string};   // number => string
    notes:      {[key: number]: string};   // number => string
    checks:     {[key: number]: boolean};  // number => boolean
    containers: {[key: number]: number};   // number => number
    positions:  {[key: number]: Position}; // number => Position
    stamps:     {[key: number]: string};   // number => string
    highlights: {[key: number]: boolean};  // number => boolean
    controls:   {[key: string]: string};   // id => attribute
    scratch:    {[key: string]: string};   // key is a rectangle, joined by ',' into a string
    edges: string[];    // strings
    guesses: GuessLog[];
    usage: string|undefined;
    // started: Date|null;
    // latest: Date|null;
    time: Date|null;
}

type LocalSavePoint = {
    savePoints: LocalCacheStruct[];    
}

var localCache:LocalCacheStruct = { 
    letters: {}, 
    words: {}, 
    notes: {}, 
    checks: {},
    containers: {}, 
    positions: {}, 
    stamps: {}, 
    highlights: {}, 
    controls: {}, 
    scratch: {}, 
    edges: [], 
    guesses: [], 
    usage: undefined,
    // started: null, 
    // latest: null ,
    time: null,
};

////////////////////////////////////////////////////////////////////////
// User interface
//

/**
 * Set to false to disable saving (and restoring)
 */
let CacheChangesInLocalStorage = true;

let checkStorage:any = null;

/**
 * Saved state uses local storage, keyed off this page's URL
 * minus any parameters
 */
export function storageKey() {
    return window.location.origin + window.location.pathname;
}

/**
 * If storage exists from a previous visit to this puzzle, offer to reload.
 */
export function checkLocalStorage() {
    if (!CacheChangesInLocalStorage) {
        return;
    }

    // Each puzzle is cached within localStorage by its URL
    const key = storageKey();
    if (!isIFrame() && !isRestart() && key in localStorage){
        const item = localStorage.getItem(key);
        if (item != null) {
            try {
                checkStorage = TryParseJson(item);
            }
            catch {
                checkStorage = {};
            }
            let empty = true;  // It's possible to cache all blanks, which are uninteresting
            for (let key in checkStorage) {
                if (checkStorage[key] != null && checkStorage[key] != '') {
                    empty = false;
                    break;
                }
            }
            if (!empty) {
                const force = forceReload();
                if (force === undefined) {
                    createReloadUI(checkStorage.time);
                }
                else if (force) {
                    doLocalReload(false);
                }
                else {
                    cancelLocalReload(false);
                }
            }
        }
    }
}

/**
 * Strings we parse as JSON could come from anywhere.
 * JSON.parse will throw if the JSON is not well-formed.
 * Instead, return null.
 * @param str A string we expect to be JSON
 * @returns An object, or null
 */
export function TryParseJson(str:string, errorIfNot:boolean = true) {
    try {
        var obj = JSON.parse(str);
        return obj;
    }
    catch (ex) {
        if (errorIfNot) {
            console.error(ex);
        }
        return null;
    }
}

/**
 * Globals for reload UI elements
 */
let reloadDialog:HTMLDivElement;
let reloadButton:HTMLButtonElement;
let restartButton:HTMLButtonElement;

/**
 * Create a modal dialog, asking the user if they want to reload.
 * @param time The time the cached data was saved (as a string)
 * 
 * If a page object can be found, compose a dialog:
 *   +-------------------------------------------+
 *   | Would you like to reload your progress on |
 *   | [title] from earlier? The last change was |
 *   | [## time-units ago].                      |
 *   |                                           |
 *   |       [Reload]     [Start over]           |
 *   +-------------------------------------------+
 * else use the generic javascript confirm prompt.
 */
function createReloadUI(time:string) {
    reloadDialog = document.createElement('div');
    reloadDialog.id = 'reloadLocalStorage';
    let img:HTMLImageElement|null = null;
    if (getSafariDetails().icon) {
        img = document.createElement('img');
        img.classList.add('icon');
        img.src = getSafariDetails().icon!;
    }
    const title = document.createElement('span');
    title.classList.add('title-font');
    title.innerText = document.title;
    const p1 = document.createElement('p');
    p1.appendChild(document.createTextNode('Would you like to reload auto-saved progress on '));
    p1.appendChild(title);
    p1.appendChild(document.createTextNode(' from earlier?'));
    const now = new Date();
    const dateTime = new Date(time);
    const delta = now.getTime() - dateTime.getTime();
    const seconds = Math.ceil(delta / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    let ago = 'The last change was ';
    if (days >= 2) {
        ago += days + ' days ago.';
    }
    else if (hours >= 2) {
        ago += hours + ' hours ago.';
    }
    else if (minutes >= 2) {
        ago += minutes + ' minutes ago.';
    }
    else {
        ago += seconds + ' seconds ago.';
    }
    var p2 = document.createElement('p');
    p2.innerText = ago;
    reloadButton = document.createElement('button');
    reloadButton.innerText = 'Reload';
    reloadButton.onclick = function(){doLocalReload(true)};
    reloadButton.onkeydown = function(e){onkeyReload(e)}
    restartButton = document.createElement('button');
    restartButton.innerText = 'Start over';
    restartButton.onclick = function(){cancelLocalReload(true)};
    restartButton.onkeydown = function(e){onkeyReload(e)};
    var p3 = document.createElement('p');
    p3.appendChild(reloadButton);
    p3.appendChild(restartButton);
    if (img) { reloadDialog.appendChild(img); }
    reloadDialog.appendChild(p1);
    reloadDialog.appendChild(p2);
    reloadDialog.appendChild(p3);
    var page = document.getElementById('page');
    if (page == null) {
        if (confirm("Continue where you left off?")) {
            doLocalReload(false);
        }
        else {
            cancelLocalReload(false);
        }
    }
    else {
        page.appendChild(reloadDialog);
        reloadButton.focus();
    }
}

/**
 * Handle keyboard accelerators while focus is on either reload button
 */
function onkeyReload(e:KeyboardEvent) {
    if (e.code=='Escape'){
        cancelLocalReload(true)
    }
    else if (e.code.search('Arrow') == 0) {
        if (e.target == reloadButton) {
            restartButton.focus();
        }
        else {
            reloadButton.focus();
        }
    }
}

/**
 * User has confirmed they want to reload
 * @param hide true if called from reloadDialog
 */
function doLocalReload(hide:boolean) {
    if (hide) {
        reloadDialog.style.display = 'none';
    }
    loadLocalStorage(checkStorage);
}

/**
 * User has confirmed they want to start over
 * @param hide true if called from reloadDialog
 */
function cancelLocalReload(hide:boolean) {
    if (hide) {
        reloadDialog.style.display = 'none';
    }
    // Clear cached storage
    checkStorage = null;
    localStorage.removeItem(storageKey());
}

//////////////////////////////////////////////////////////
// Utilities for managing multiple save-points
//


//////////////////////////////////////////////////////////
// Utilities for saving to local cache
//

/**
 * Overwrite the localStorage with the current cache structure
 */
function saveCache(pingEdit:boolean) {
    if (!reloading && CacheChangesInLocalStorage) {
        localCache.time = new Date(); 
        localStorage.setItem(storageKey(), JSON.stringify(localCache));

        if (pingEdit && !isEmptyCache()) {
            pingEventServer(EventSyncActivity.Edit);
        }
    }
}

function isEmptyCache():boolean {
    if (Object.values(localCache.letters).find(x => x != '') != null) {
        return false;
    }
    if (Object.values(localCache.words).find(x => x != '') != null) {
        return false;
    }
    if (Object.values(localCache.positions).length > 0) {
        return false;
    }
    if (Object.keys(localCache.stamps).length > 0) {
        return false;
    }
    if (localCache.edges.length > 0) {
        return false;
    }
    if (Object.keys(localCache.scratch).length > 0) {
        return false;
    }
    if (Object.values(localCache.checks).find(x => x === true)) {
        return false;
    }
    return true;
}

/**
 * Update the saved letters object
 * @param element an letter-input element
 */
export function saveLetterLocally(input:HTMLInputElement) {
    if (input && input != currently_restoring) {
        var index = getGlobalIndex(input);
        if (index >= 0) {
            localCache.letters[index] = input.value;
            saveCache(true);  
        }  
    }
}

/**
 * Update the saved words object
 * @param element an word-input element
 */
export function saveWordLocally(input:HTMLInputElement) {
    if (input && input != currently_restoring) {
        var index = getGlobalIndex(input);
        if (index >= 0) {
            localCache.words[index] = input.value;
            saveCache(true);
        }  
    }
}

/**
 * Update the saved notes object
 * @param element an note-input element
 */
export function saveNoteLocally(input:HTMLInputElement) {
    if (input) {
        var index = getGlobalIndex(input);
        if (index >= 0) {
            localCache.notes[index] = input.value;
            saveCache(true);  
        }  
    }
}

/**
 * Update the saved checkmark object
 * @param element an element which might contain a checkmark
 */
export function saveCheckLocally(element:HTMLElement, value:boolean) {
    if (element) {
        var index = getGlobalIndex(element);
        if (index >= 0) {
            localCache.checks[index] = value;
            saveCache(true);
        }
    }
}

/**
 * Update the saved containers objects
 * @param element an element which can move between containers
 */
export function saveContainerLocally(element:HTMLElement, container:HTMLElement) {
    if (element && container) {
        var elemIndex = getGlobalIndex(element);
        var destIndex = getGlobalIndex(container);
        if (elemIndex >= 0 && destIndex >= 0) {
            localCache.containers[elemIndex] = destIndex;
            saveCache(true);
        }
    }
}

/**
 * Update the saved positions object
 * @param element a moveable element which can free-move in its container
 */
export function savePositionLocally(element:HTMLElement) {
    if (element) {
        var index = getGlobalIndex(element);
        if (index >= 0) {
            var pos = positionFromStyle(element);
            localCache.positions[index] = pos;
            saveCache(true);
        }
    }
}

/**
 * Update the saved drawings object
 * @param element an element which might contain a drawn object
 */
export function saveStampingLocally(element:HTMLElement) {
    if (element) {
        var index = getGlobalIndex(element);
        if (index >= 0) {
            const parent = getStampParent(element);
            const stampId = parent.getAttributeNS('', 'data-stamp-id');
            if (stampId) {
                localCache.stamps[index] = stampId;
            }
            else {
                delete localCache.stamps[index];
            }
            saveCache(true);
        }
    }
}

/**
 * Update the saved highlights object
 * @param element a highlightable object
 */
export function saveHighlightLocally(element:HTMLElement) {
    if (element) {
        var index = getGlobalIndex(element, 'ch');
        if (index >= 0) {
            localCache.highlights[index] = hasClass(element, 'highlighted');
            saveCache(true);
        }
    }
}

/**
 * Update the local cache with this vertex list.
 * @param vertexList A list of vertex global indeces
 * @param add If true, this edge is added to the saved state. If false, it is removed.
 */
export function saveStraightEdge(vertexList: string, add:boolean) {
    if (add) {
        localCache.edges.push(vertexList);
    }
    else {
        const i = localCache.edges.indexOf(vertexList);
        if (i >= 0) {
            localCache.edges.splice(i, 1);
        }
    }
    saveCache(true);
}

/**
 * Update the local cache with the full set of guesses for this puzzle
 * @param guesses An array of guesses, in time order
 */
export function saveGuessHistory(guesses: GuessLog[]) {
    localCache.guesses = guesses;
    saveCache(false);  // Doesn't count as an edit
}

/**
 * Update the local cache with the latest notes, and where they're placed.
 * NOTE: only call this once any active note has been flattened.
 * @param scratchPad The parent div of all notes
 */
export function saveScratches(scratchPad:HTMLDivElement) {
    const map:{[key: string]: string} = {};
    const rectSP = scratchPad.getBoundingClientRect();
    const divs = scratchPad.getElementsByClassName('scratch-div');
    for (let i = 0; i < divs.length; i++) {
        const div = divs[i] as HTMLDivElement;
        const rect = div.getBoundingClientRect();
        const pos = [
            Math.ceil(rect.left-rectSP.left),
            Math.ceil(rect.top-rectSP.top),
            rect.width,
            rect.height
        ].join(',');
        const text = textFromScratchDiv(div);
        map[pos] = text;
    }
    localCache.scratch = map;
    saveCache(true);
}

type ValuableElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement;

/**
 * Save one attribute from any element that is tagged with the class 'save-state'
 * The attribute to save is named in the optional attribute 'data-save-state'.
 * If omitted, the default is the value of an form field.
 */
export function saveStates() {
    const map:{[key: string]: string} = {};
    const savers = document.getElementsByClassName('save-state');
    for (let i = 0; i < savers.length; i++) {
        const elmt = savers[i];
        const id = elmt.id;
        if (id) {
            const attr = getOptionalStyle(elmt, 'data-save-state');
            let val:string = '';
            if (!attr && isTag(elmt, ['input', 'select', 'textarea', 'button'])) {
                // Since form-field values are not normal attributes, don't specify them in data-save-state
                const val = (elmt as ValuableElement).value;
                if (val) {
                    map[id] = val;
                }
                // if (isTag(elmt, 'input')) {
                //     val = (elmt as HTMLInputElement).value
                // }
                // else if (isTag(elmt, 'select')) {
                //     val = (elmt as HTMLSelectElement).value
                // }
                // else if (isTag(elmt, 'textarea')) {
                //     val = (elmt as HTMLTextAreaElement).value
                // }
                // else if (isTag(elmt, 'button')) {
                //     val = (elmt as HTMLButtonElement).value
                // }
            }
            else if (attr == 'class') {
                const classes:string[] = [];
                elmt.classList.forEach((s,n) => classes.push(s));
                if (classes.length > 0) {
                    map[id] = classes.join(' ');
                }
            }
            else if (attr) {
                const val = elmt.getAttributeNS('', attr);
                if (val) {
                    map[id] = val;
                }
            }
        }
    }
    if (Object.keys(map).length > 0) {
        localCache.controls = map;
        saveCache(true);
    }
}

////////////////////////////////////////////////////////////////////////
// Utilities for applying global indeces for saving and loading
//

/**
 * Assign indeces to all of the elements in a group
 * @param elements A list of elements
 * @param suffix A variant name of the index (optional)
 * @param offset A number to shift all indeces (optional) - used when two collections share an index space
 */
function applyGlobalIndeces(elements:HTMLCollectionOf<Element>, suffix?:string, offset?:number) {
    let attr = 'data-globalIndex';
    if (suffix != undefined) {
        attr += '-' + suffix;
    }
    if (!offset) {
        offset = 0;
    }
    for (let i = 0; i < elements.length; i++) {
        elements[i].setAttributeNS('', attr, String(i));
    }
}

/**
 * At page initialization, every element that can be cached gets an index attached to it.
 * Possibly more than one, if it can cache multiple traits.
 * Now retrieve that index.
 * @param elmt The element with the index
 * @param suffix The name of the index (optional)
 * @returns The index, or -1 if invalid
 */
export function getGlobalIndex(elmt:HTMLElement, suffix?:string):number {
    if (elmt) {
        let attr = 'data-globalIndex';
        if (suffix != undefined) {
            attr += '-' + suffix;
        }
        const index = elmt.getAttributeNS('', attr);
        if (index) {  // not null or empty
            return Number(index);
        }
    }
    return -1;
}

/**
 * At page initialization, every element that can be cached gets an index attached to it.
 * Possibly more than one, if it can cache multiple traits.
 * Find the element with the desired global index.
 * @param cls A class, to narrow down the set of possible elements
 * @param index The index
 * @param suffix The name of the index (optional)
 * @returns The element
 */
export function findGlobalIndex(cls: string, index: number, suffix?:string) :HTMLElement|null {
    const elements = document.getElementsByClassName(cls);
    for (let i = 0; i < elements.length; i++) {
        const elmt = elements[i] as HTMLElement;
        if (index == getGlobalIndex(elmt, suffix)) {
            return elmt;
        }
    }
    return null;
}

/**
 * Create a dictionary, mapping global indeces to the corresponding elements
 * @param cls the class tag on all applicable elements
 * @param suffix the optional suffix of the global indeces
 */
export function mapGlobalIndeces(cls:string, suffix?:string):{[key: number]: HTMLElement} {
    const map:{[key: number]: HTMLElement} = {};
    const elements = document.getElementsByClassName(cls);
    for (let i = 0; i < elements.length; i++) {
        const index = getGlobalIndex(elements[i] as HTMLElement, suffix);
        if (index >= 0) {
            map[index] = elements[i] as HTMLElement;
        }
    }
    return map;
}

/**
 * Assign globalIndeces to every letter- or word- input field
 */
export function indexAllInputFields() {
    let inputs = document.getElementsByClassName('letter-input');
    applyGlobalIndeces(inputs);
    inputs = document.getElementsByClassName('word-input');
    applyGlobalIndeces(inputs);
}

/**
 * Assign globalIndeces to every note field
 */
export function indexAllNoteFields() {
    const inputs = document.getElementsByClassName('note-input');
    applyGlobalIndeces(inputs);
}

/**
 * Assign globalIndeces to every check mark
 */
export function indexAllCheckFields() {
    const checks = document.getElementsByClassName('cross-off');
    applyGlobalIndeces(checks);
}

/**
 * Assign globalIndeces to every moveable element and drop target
 */
export function indexAllDragDropFields() {
    let inputs = document.getElementsByClassName('moveable');
    applyGlobalIndeces(inputs);
    inputs = document.getElementsByClassName('drop-target');
    applyGlobalIndeces(inputs);
}

/**
 * Assign globalIndeces to every stampable element
 */
export function indexAllDrawableFields() {
    const inputs = document.getElementsByClassName('stampable');
    applyGlobalIndeces(inputs);
}

/**
 * Assign globalIndeces to every highlightable element
 */
export function indexAllHighlightableFields() {
    const inputs = document.getElementsByClassName('can-highlight');
    applyGlobalIndeces(inputs, 'ch');
}

/**
 * Assign globalIndeces to every vertex
 */
export function indexAllVertices() {
    const inputs = document.getElementsByClassName('vertex');
    applyGlobalIndeces(inputs, 'vx');
}

////////////////////////////////////////////////////////////////////////
// Load from local storage
//

/**
 * Avoid re-entrancy. Track if we're mid-reload
 */
let reloading = false;

/**
 * Load all structure types from storage
 */
function loadLocalStorage(storage:LocalCacheStruct) {
    reloading = true;
    restoreLetters(storage.letters);
    restoreWords(storage.words);
    restoreNotes(storage.notes);
    restoreCrossOffs(storage.checks);
    restoreContainers(storage.containers);
    restorePositions(storage.positions);
    restoreStamps(storage.stamps);
    restoreHighlights(storage.highlights);
    restoreEdges(storage.edges);
    restoreGuesses(storage.guesses);
    restoreScratches(storage.scratch);
    restoreStates(storage.controls);
    reloading = false;

    const fn = theBoiler().onRestore;
    if (fn) {
        fn();
    }
}

let currently_restoring:HTMLElement|null = null;

/**
 * Restore any saved letter input values
 * @param values A dictionary of index=>string
 */
function restoreLetters(values:{[key: number]: string}) {
    localCache.letters = values;
    var inputs = document.getElementsByClassName('letter-input');
    for (let i = 0; i < inputs.length; i++) {
        currently_restoring = inputs[i] as HTMLElement;
        var input = inputs[i] as HTMLInputElement;
        var value = values[i] as string;
        if(value != undefined){
            input.value = value;
            afterInputUpdate(input, values[i]);
        }
    }
    currently_restoring = null;
}

/**
 * Restore any saved word input values
 * @param values A dictionary of index=>string
 */
function restoreWords(values:{[key: number]: string}) {
    localCache.words = values;
    var inputs = document.getElementsByClassName('word-input');
    for (let i = 0; i < inputs.length; i++) {
        currently_restoring = inputs[i] as HTMLElement;
        var input = inputs[i] as HTMLInputElement;
        var value = values[i] as string;
        if(value != undefined){
            input.value = value;
            if (value.length > 0) {
                afterInputUpdate(input, value.substring(value.length - 1));
            }
            var extractId = getOptionalStyle(input, 'data-extracted-id', undefined, 'extracted-');
            if (extractId != null) {
                updateWordExtraction(extractId);
            }            
        }
    }
    currently_restoring = null;
    if (inputs.length > 0) {
        updateWordExtraction(null);
    }
}

/**
 * Restore any saved note input values
 * @param values A dictionary of index=>string
 */
function restoreNotes(values:{[key: number]: string}) {
    localCache.notes = values;
    var elements = document.getElementsByClassName('note-input');
    for (let i = 0; i < elements.length; i++) {
        var element = elements[i] as HTMLInputElement;
        var globalIndex = getGlobalIndex(element);
        var value = values[globalIndex] as string;
        if (value != undefined){
            element.value = value;
        }
    }  
}

/**
 * Restore any saved note input values
 * @param values A dictionary of index=>boolean
 */
function restoreCrossOffs(values:{[key: number]: boolean}) {
    localCache.checks = values;
    let elements = document.getElementsByClassName('cross-off');
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;
        const globalIndex = getGlobalIndex(element);
        const value = values[globalIndex] as boolean;
        if(value != undefined){
            toggleClass(element, 'crossed-off', value);
        }
    }  
}

/**
 * Restore any saved moveable objects to drop targets
 * @param containers A dictionary of moveable-index=>target-index
 */
function restoreContainers(containers:{[key: number]: number}) {
    localCache.containers = containers;
    var movers = document.getElementsByClassName('moveable');
    var targets = document.getElementsByClassName('drop-target');
    // Each time an element is moved, the containers structure changes out from under us. So pre-fetch.
    const moving:number[] = [];
    for (let key in containers) {
        moving[parseInt(key)] = containers[key];
    }
    for (let key in moving) {
        const mover = findGlobalIndex('moveable', parseInt(key));
        const target = findGlobalIndex('drop-target', moving[key]);
        if (mover && target) {
            quickMove(mover, target);
        }
    }    
}

/**
 * Restore any saved moveable objects to free-positions within their targets
 * @param positions A dictionary of index=>Position
 */
function restorePositions(positions:{[key: number]: Position}) {
    localCache.positions = positions;
    var movers = document.getElementsByClassName('moveable');
    for (let i = 0; i < movers.length; i++) {
        var pos = positions[i] as Position;
        if (pos != undefined) {
            quickFreeMove(movers[i] as HTMLElement, pos);
        }
    }
}

/**
 * Restore any saved note input values
 * @param values A dictionary of index=>string
 */
function restoreStamps(drawings:{[key: number]: string}) {
    localCache.stamps = drawings;
    var targets = document.getElementsByClassName('stampable');
    for (let i = 0; i < targets.length; i++) {
        var tool = drawings[i] as string;
        if (tool != undefined) {
            const stamp = document.getElementById(tool);
            if (stamp) {
                doStamp(undefined, targets[i] as HTMLElement, stamp);
            }
        }
    }
}

/**
 * Restore any saved highlight toggle
 * @param highlights A dictionary of index=>boolean
 */
function restoreHighlights(highlights:{[key: number]: boolean}) {
    localCache.highlights = highlights == undefined ? {} : highlights;
    var elements = document.getElementsByClassName('can-highlight');
    for (let i = 0; i < elements.length; i++) {
        var element = elements[i] as HTMLElement;
        var globalIndex = getGlobalIndex(element, 'ch');
        var value = highlights[globalIndex] as boolean;
        if (value != undefined){
            toggleClass(element, 'highlighted', value);
        }
    }
}

/**
 * Recreate any saved straight-edges and word-selections
 * @param vertexLists A list of strings, where each string is a comma-separated-list of vertices
 */
function restoreEdges(vertexLists:string[]) {
    if (!vertexLists) {
        vertexLists = [];
    }
    localCache.edges = vertexLists;
    for (let i = 0; i < vertexLists.length; i++) {
        createFromVertexList(vertexLists[i]);
    }
}

/**
 * Recreate any saved guesses and their responses
 * @param guesses A list of guess structures
 */
function restoreGuesses(guesses:GuessLog[]) {
    if (!guesses) {
        guesses = [];
    }
    for (let i = 0; i < guesses.length; i++) {
        const src = guesses[i];
        // Rebuild the GuessLog, to convert the string back to a DateTime
        const gl:GuessLog = { field:src.field, guess:src.guess, time:new Date(String(src.time)) };
        decodeAndValidate(gl);
        // Decoding will rebuild the localCache
    }
}

/**
 * Update the local cache with the latest notes, and where they're placed.
 * NOTE: only call this once any active note has been flattened.
 */
function restoreScratches(scratch:{[key: string]: string}) {
    localCache.scratch = scratch;
    
    scratchClear();
    const points = Object.keys(scratch);
    for (let i = 0; i < points.length; i++) {
        const pos = points[i];
        const xywh = pos.split(',').map(n => parseInt(n));
        const text = scratch[pos];
        scratchCreate(xywh[0], xywh[1], xywh[2], xywh[3], text);
    }
}

/**
 * Restore any elements tagged as save-state.
 * They must each have a unique ID. One attribute may be saved for each.
 * @param controls 
 */
function restoreStates(controls:{[key: string]: string}) {
    localCache.controls = controls;

    const savers = document.getElementsByClassName('save-state');
    for (let i = 0; i < savers.length; i++) {
        const elmt = savers[i];
        const id = elmt.id;
        if (id && controls[id] !== undefined) {
            const attr = getOptionalStyle(elmt, 'data-save-state');
            if (!attr && isTag(elmt, ['input', 'select', 'textarea', 'button'])) {
                (elmt as ValuableElement).value = controls[id];
            }
            else if (attr === 'class') {
                const oldClasses = getAllClasses(elmt).filter((v) => v !== 'save-state');
                clearAllClasses(elmt, oldClasses);
                const classes = controls[id].split(' ');
                for (let c = 0; c < classes.length; c++) {
                    toggleClass(elmt, classes[c], true);
                }
            }
            else if (attr) {
                elmt.setAttributeNS('', attr, controls[id]);
            }
            else {
                continue;
            }

            // If we've set anything, give the element a chance to reload
            const load = new Event("load");
            elmt.dispatchEvent(load);
        }
    }
}

////////////////////////////////////////////////////////////////////////
// Utils for working with the shared puzzle list
//

/**
 * A limited list of meaningful puzzle statuses
 */
export const PuzzleStatus = {
    Hidden: 'hidden',  // A puzzle the player should not even see
    Locked: 'locked',  // A puzzle the player should not have a link to
    Unlocked: 'unlocked',  // A puzzle that the player can now reach
    Loaded: 'loaded',  // A puzzle which has been loaded, possibly triggering secondary storage
    Solved: 'solved',  // A puzzle which is fully solved
}

/**
 * Update the master list of puzzles for this event
 * @param puzzle The name of this puzzle (not the filename)
 * @param status One of the statuses in PuzzleStatus
 * @param puzzleList The relative path to the puzzle_list to update (omit if local)
 * @returns true if the new status is different than the old
 */
export function updatePuzzleList(puzzle:string|null, status:string, puzzleList?:string):boolean {
    if (!puzzle) {
        puzzle = getCurFileName();
    }
    let up = 0;
    puzzleList = puzzleList || 'puzzle_list';
    while (puzzleList.startsWith('../')) {
        puzzleList = puzzleList.substring(3);
        up += 1;
    }
    const key = getOtherFileHref(puzzleList, up);
    let pList: {[key: string]: string} = {};
    if (key in localStorage) {
        const item = localStorage.getItem(key);
        if (item) {
            pList = TryParseJson(item);
        }
    }
    if (!pList) {
        pList = {};
    }
    const prev = pList[puzzle];
    pList[puzzle] = status;
    localStorage.setItem(key, JSON.stringify(pList));
    return status !== prev;
}

/**
 * Lookup the status of a puzzle
 * @param puzzle The name of a puzzle
 * @param defaultStatus The initial status, before a player updates it
 * @param puzzleList The relative path to the puzzle_list to update (omit if local)
 * @returns The saved status
 */
export function getPuzzleStatus(puzzle:string|null, defaultStatus?:string, puzzleList?:string): string|undefined {
    if (!puzzle) {
        puzzle = getCurFileName();
    }
    let up = 0;
    puzzleList = puzzleList || 'puzzle_list';
    while (puzzleList.startsWith('../')) {
        puzzleList = puzzleList.substring(3);
        up += 1;
    }
    const key = getOtherFileHref(puzzleList, up);
    let pList: {[key: string]: string} = {};
    if (key in localStorage) {
        const item = localStorage.getItem(key);
        if (item) {
            pList = TryParseJson(item);
            if (pList && puzzle in pList) {
                return pList[puzzle];
            }
        }
    }
    return defaultStatus;
}

/**
 * Return a list of puzzles we are tracking, which currently have the indicated status
 * @param status one of the valid status strings
 */
export function listPuzzlesOfStatus(status:string): string[] {
    const list:string[] = [];
    var key = getOtherFileHref('puzzle_list', 0);
    if (key in localStorage) {
        const item = localStorage.getItem(key);
        if (item) {
            const pList = TryParseJson(item);
            if (pList) {
                const names = Object.keys(pList);
                for (let i = 0; i < names.length; i++) {
                    const name = names[i];
                    if (pList[name] === status) {
                        list.push(name);
                    }
                }
            }
        }
    }
    return list;
}

/**
 * Clear the list of which puzzles have been saved, unlocked, etc.
 */
export function resetAllPuzzleStatus() {
    var key = getOtherFileHref('puzzle_list', 0);
    localStorage.setItem(key, JSON.stringify(null));
}

/**
 * Clear any saved progress on this puzzle
 * @param puzzleFile a puzzle filename
 */
export function resetPuzzleProgress(puzzleFile:string) {
    var key = getOtherFileHref(puzzleFile, 0);
    localStorage.setItem(key, JSON.stringify(null));
}

////////////////////////////////////////////////////////////////////////
// Utils for sharing data between puzzles
//

/**
 * Save when meta materials have been acquired.
 * @param puzzle The meta-puzzle name
 * @param up Steps up from current folder where meta puzzle is found
 * @param page The meta-clue label (i.e. part 1 or B)
 * @param obj Any meta object structure
 */
function saveMetaMaterials(puzzle:string, up:number, page:string, obj:object) {
    var key = getOtherFileHref(puzzle, up) + "-" + page;
    localStorage.setItem(key, JSON.stringify(obj));
}

/**
 * Load cached meta materials, if they have been acquired.
 * @param puzzle The meta-puzzle name
 * @param up Steps up from current folder where meta puzzle is found
 * @param page The meta-clue label (i.e. part 1 or B)
 * @returns An object - can be different for each meta type, or undefined if not unlocked
 */
export function loadMetaMaterials(puzzle:string, up:number, page:number): object|undefined {
    var key = getOtherFileHref(puzzle, up) + "-" + page;
    return loadMetaPiece(key);
}

/**
 * Load cached meta materials, if they have been acquired.
 * @param key The meta-piece name. Often a concatenation of the meta puzzle and a piece #
 * @returns An object - can be different for each meta type, or undefined if not unlocked
 */
export function loadMetaPiece(key:string): object|undefined {
    if (key in localStorage) {
        const item = localStorage.getItem(key);
        if (item) {
            return TryParseJson(item);
        }
    }
    return undefined;
}

/**
 * Get the last level of the URL's pathname
 */
export function getCurFileName(no_extension:boolean = true) {
    const key = window.location.pathname;
    const bslash = key.lastIndexOf('\\');
    const fslash = key.lastIndexOf('/');
    const parts = key.split(fslash >= bslash ? '/' : '\\');
    let name = parts[parts.length - 1];
    if (no_extension) {
        const dot = name.split('.');
        if (dot.length > 1) {
            name = name.substring(0, name.length - 1 - dot[dot.length - 1].length);
        }
    }
    return name;
}

// Convert the absolute href of the current window to a relative href
// levels: 1=just this file, 2=parent folder + file, etc.
function getRelFileHref(levels:number) {
    const key = storageKey();
    const bslash = key.lastIndexOf('\\');
    const fslash = key.lastIndexOf('/');
    let delim = '/';
    if (fslash < 0 || bslash > fslash) {
        delim = '\\';
    }

    const parts = key.split(delim);
    parts.splice(0, parts.length - levels)
    return parts.join(delim);
}

/**
 * Convert the absolute href of the current window to an absolute href of another file
 * @param file name of another file
 * @param up the number of steps up. 0=same folder. 1=parent folder, etc.
 * @param rel if set, only return the last N terms of the relative path
 * @returns a path to the other file
 */
function getOtherFileHref(file:string, up?:number, rel?:number):string {
    const key = storageKey();
    const bslash = key.lastIndexOf('\\');
    const fslash = key.lastIndexOf('/');
    let delim = '/';
    if (fslash < 0 || bslash > fslash) {
        delim = '\\';
    }

    // We'll replace the current filename and potentially some parent folders
    if (!up) {
        up = 1
    }
    else {
        up += 1;
    }

    var parts = key.split(delim);
    parts.splice(parts.length - up, up, file);

    if (rel) {
        parts.splice(0, parts.length - rel);
    }

    return parts.join(delim);
}

////////////////////////////////////////////////////////////////////////
// Utils for forgetting
//

/**
 * Utility for backdoor event reset pages
 * @param path A prefix to search for across all stored keys.
 * Because the storage pattern we use is to key off filenames,
 * specifying a folder will clear one event without clearing a second.
 */
export function forgetChildrenOf(path:string):number {
    if (!path) {
        const count = localStorage.length;
        localStorage.clear();
        return count;
    }
    let count = 0;
    const keys = Object.keys(localStorage);
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].indexOf(path) == 0) {
            localStorage.removeItem(keys[i])
            count++;
        }
    }
    return count;
}

////////////////////////////////////////////////////////////////////////
// Utils for login
//

/**
 * Read any cached login-info. Logins are per-event
 * @param event The current event
 * @returns A login info, or null if not logged in
 */
export function getLogin(event?:string):LoginInfo|null {
    if (!event) {
        return null;
    }
    const key = getOtherFileHref('login-' + event, 0);
    const val = localStorage.getItem(key);
    if (val) {
        const login = (TryParseJson(val) as LoginInfo);
        if (login && login.player) {  // Ensure valid
            return login;
        }
    }
    return null;
}

/**
 * Save the login (or logged-out) info
 * @param event The current event
 * @param data What to save. Null means logged out.
 */
export function cacheLogin(event?:string, data?:LoginInfo) {
    if (event) {
        const key = getOtherFileHref('login-' + event, 0);
        if (data) {
            localStorage.setItem(key, JSON.stringify(data));
        }
        else {
            localStorage.removeItem(key);                        
        }
    }
}