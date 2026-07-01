import { findAncestor } from "typescript";
import { theBoiler } from "./boilerplate";
import { useTemplate } from "./builderUse";
import { applyAllClasses, clearAllClasses, findFirstChildOfClass, findNthChildOfClass, findParentOfClass, findParentOfTag, getElementsByClassOrId, getOptionalStyle, hasClass, isTag, siblingIndexOfClass, toggleClass } from "./classUtil";
import { ContextError, elementSourceOffset } from "./contextError";
import { saveStampingLocally } from "./storage";

// VOCABULARY
// stampable: any object which can be clicked on to draw an icon
// stampPalette: the toolbar from which a user can see and select the draw tools
// stampTool: a UI control to make one or another draw mode the default
// selected: when a stampTool is primary, and will draw when clicking in an active area
// stampToolTemplates: a hidden container of objects that are cloned when drawn
// stampedObject: templates for cloning when drawn

/**
 * Type structure of a stamp tool, as provided to a classStampPalette template
 */
export type StampToolDetails = {
    id: string,
    modifier?: string,
    label?: string,
    img?: string,  // img src url
    next?: string,  // id of another tool
    data?: string,  // extra data, depending on context
};

/**
 * Map a stampable area to a palette of stamps.
 */
type stampSet = {
    name: string;
    container: HTMLElement|null;  // can be null, in which case stampables stand alone
    palette: HTMLElement|null;  // The container of stamp tools
    stampTools: HTMLElement[];  // The tools in the palette
    selectedTool: HTMLElement|null;  // The currently selected tool from the palette
    firstTool: HTMLElement|null;  // The tool name to cycle to first
    eraseTool: HTMLElement|null;  // The tool name that would erase things
    extractorTool: HTMLElement|null;  // A tool which, as a side effect, extracts an answer from the content under it
    extractedId?: string;
    canDrag: boolean;  // These stamps can be used like paint brushes
    prevStampablePointer:HTMLElement|null;
    dragDrawTool: HTMLElement|null;
    lastDrawTool: HTMLElement|null;
    usesMods: boolean;  // The stamp palette specifies special ctrl+/shift+/alt+ clicks
}

/**
 * Initialize a stampSet object with nulls
 * @param container The container may already be known
 * @returns A new, blank object
 */
function makeStampSet(container?:HTMLElement) {
    const ss:stampSet = {
        name: '',
        container: container || null,
        palette: null,
        stampTools: [],
        selectedTool: null,
        firstTool: null,
        eraseTool: null,
        extractorTool: null,
        canDrag: false,
        prevStampablePointer: null,
        dragDrawTool: null,
        lastDrawTool: null,
        usesMods: false,
    }
    return ss;
}

/**
 * Look up a stamp set by name
 */
const _stampSets: { [key:string]: stampSet } = {};

/**
 * Scan the page for anything marked stampable or a draw tool
 */
export function preprocessStampObjects() {
    const containers = document.getElementsByClassName('stampable-container');
    for (let i = 0; i < containers.length; i++) {
        const container = containers[i] as HTMLElement;
        container.addEventListener('pointerdown', pointerDownInContainer);
        const setInfo:stampSet = makeStampSet(container);
        
        // TODO: Deprecate rules
        preprocessStampRules(container, setInfo);
        
        if (hasClass(container, 'stamp-drag')) {
            setInfo.canDrag = true;
            container.addEventListener('pointerup', pointerUpInContainer);
            container.addEventListener('pointermove', pointerMoveInContainer);
            container.addEventListener('pointerleave', pointerLeaveContainer);    
        }
        else {
            setInfo.canDrag = false;
        }

        // If a page has multiple containers, they must be named
        setInfo.name = container.getAttributeNS('', 'data-stamp-set') || '';
        if (setInfo.name in _stampSets) {
            throw new ContextError('Different stampable-containers must have unique names: ' + setInfo.name, 
                elementSourceOffset(container, 'data-stamp-set'));
        }
        _stampSets[setInfo.name] = setInfo;
    }

    let elems = document.getElementsByClassName('stampable');
    if (containers.length == 0 && elems.length > 0) {
        _stampSets[''] = makeStampSet();
        const container = document.getElementById('pageBody');
        if (container) {
            container.addEventListener('pointerdown', pointerDownInContainer);
        }
    }

    const palettes = getElementsByClassOrId('stampPalette', 'stampPalette');
    for (let p = 0; p < palettes.length; p++) {
        const palette = palettes[p];

        const setName = palette.getAttributeNS('', 'data-stamp-set') || '';
        if (!(setName in _stampSets)) {
            // A palette can be known before the container, if the container is built dynamically
            _stampSets[setName] = makeStampSet();
        }
        const setInfo = _stampSets[setName] as stampSet;

        elems = palette.getElementsByClassName('stampTool');
        for (let i = 0; i < elems.length; i++) {
            const elmt = elems[i] as HTMLElement;
            setInfo.stampTools.push(elmt);
            elmt.onclick=function(e){onSelectStampTool(e)};
            if (getOptionalStyle(elmt, 'data-click-modifier')) {
                setInfo.usesMods = true;
            }
        }
    
        // Extractor tool can overlap with other tools
        let id = palette.getAttributeNS('', 'data-tool-extractor');
        if (id != null) {
            setInfo.extractorTool = document.getElementById(id);
            // If we're extracting, an optional extracted-id could be set on either the tool/palette or the container
            setInfo.extractedId = getOptionalStyle(setInfo.extractorTool, 'data-extracted-id', undefined, 'extracted-') 
                || getOptionalStyle(setInfo.container, 'data-extracted-id', undefined, 'extracted-') 
                || 'extracted';
        }

        // Two kinds of erase tools. Explicit and implicit.
        id = palette.getAttributeNS('', 'data-tool-erase');
        if (id != null) {
            // Explicit: one of the stampTools is the eraser.
            setInfo.eraseTool = id != null ? document.getElementById(id) : null;
        }
        else {
            const unstyle = palette.getAttributeNS('', 'data-unstyle');
            const restyle = palette.getAttributeNS('', 'data-style');
            if (unstyle || restyle) {
                // Implicit: the palette itself knows how to erase
                setInfo.eraseTool = document.createElement('span');
                // Don't need to actually add this element to the page. It's just a placeholder.
                if (unstyle) {
                    setInfo.eraseTool.setAttributeNS('', 'data-unstyle', unstyle);
                }
                if (restyle) {
                    setInfo.eraseTool.setAttributeNS('', 'data-style', restyle);
                }
            }
        }

        id = palette.getAttributeNS('', 'data-tool-first');
        setInfo.firstTool = id != null ? document.getElementById(id) : null;

        if (!setInfo.firstTool) {
            setInfo.firstTool = setInfo.stampTools[0];
        }
    }
}

function preprocessStampRules(container:HTMLElement, setInfo:stampSet) {
    const rules = getOptionalStyle(container, 'data-stampable-rules');
    if (rules) {
        const list = rules.split(' ');
        for (let r = 0; r < list.length; r++) {
            const rule = list[r];
            if (rule[0] == '.') {
                const children = container.getElementsByClassName(rule.substring(1));
                for (let i = 0; i < children.length; i++) {
                    toggleClass(children[i], 'stampable', true);
                }
            }
            else if (rule[0] == '#') {
                const child = document.getElementById(rule.substring(1));
                toggleClass(child, 'stampable', true);
            }
            else {
                const children = container.getElementsByTagName(rule.toLowerCase());
                for (let i = 0; i < children.length; i++) {
                    toggleClass(children[i], 'stampable', true);
                }
            }
        }
    }
}

/**
 * Find the stamp set that should be associated with clicks on either 
 * stampable or stampTool elements.
 * @param event A mouse event.
 * @returns A stamp set
 */
function stampSetFromEvent(event:UIEvent):stampSet {
    return stampSetFromElement(event.target as Element);
}

/**
 * Find the stamp set that should be associated with either 
 * stampable or stampTool elements. When in doubt, return the
 * default stamp set ('')
 * @param elmt An element
 * @returns A stamp set
 */
function stampSetFromElement(elmt:Element):stampSet {
    const name = getOptionalStyle(elmt, 'data-stamp-set') || '';
    if (!(name in _stampSets)) {
        throw Error('Cannot find stamp set matching target: ' + elmt);
    }

    // Might need to belatedly stitch together a stamp container and a stamp palette
    // They can be separate entries in the _stampSets.
    const stampSet = _stampSets[name];
    if (stampSet && (!stampSet.stampTools || stampSet.stampTools.length == 0)) {
        // Reuse the stamps from another set
        const altName = stampSet.container?.getAttributeNS('', 'data-stamp-palette') ?? "";
        const setKeys = Object.keys(_stampSets);
        for (var i = 0; i < setKeys.length; i++) {
            const altSet = _stampSets[setKeys[i]];
            if (setKeys[i] == altName && altSet.stampTools) {
                _stampSets[name] = altSet;
                return altSet;
            }
        }
    }
    return stampSet;
}

function pointerDownInContainer(event:PointerEvent) {
    if (!isPrimaryButton(event)) {
        return;
    }
    const stampSet = stampSetFromEvent(event);
    if (!stampSet.usesMods && (event.ctrlKey || event.shiftKey || event.altKey)) {
        return;
    }
    if (event.pointerType != 'mouse' && stampSet.canDrag) {
        event.preventDefault();
    }
    const elmt = findStampableAtPointer(event);
    if (elmt) {
        stampSet.prevStampablePointer = elmt;
        onClickStamp(stampSet, event, elmt);
    }
}

function pointerUpInContainer(event:PointerEvent) {
    if (!isPrimaryButton(event)) {
        return;
    }
    const stampSet = stampSetFromEvent(event);
    if (!stampSet.usesMods && (event.ctrlKey || event.shiftKey || event.altKey)) {
        return;
    }
    if (event.pointerType != 'mouse' && stampSet.canDrag) {
        event.preventDefault();
    }
    stampSet.prevStampablePointer = null;
}

function pointerMoveInContainer(event:PointerEvent) {
    if (!isPrimaryButton(event)) {
        return;
    }
    const stampSet = stampSetFromEvent(event);
    if (event.pointerType != 'mouse' && stampSet.canDrag) {
        event.preventDefault();
    }
    const elmt = findStampableAtPointer(event);
    if (elmt !== stampSet.prevStampablePointer) {
        if (stampSet.prevStampablePointer) {
            preMoveStamp(stampSet, event, stampSet.prevStampablePointer);
        }
        if (elmt) {
            onMoveStamp(stampSet, event, elmt);
        }
        stampSet.prevStampablePointer = elmt;
    }
}

function pointerLeaveContainer(event:PointerEvent) {
    if (!isPrimaryButton(event)) {
        return;
    }
    const stampSet = stampSetFromEvent(event);
    if (event.pointerType != 'mouse' && stampSet.canDrag) {
        event.preventDefault();
    }
    if (stampSet.prevStampablePointer) {
        preMoveStamp(stampSet, event, stampSet.prevStampablePointer);
    }
    stampSet.prevStampablePointer = null;
}

function findStampableAtPointer(event:PointerEvent):HTMLElement|null {
    // Prefer finding via direct hit, by z-order
    const targets = document.elementsFromPoint(event.clientX, event.clientY);
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        if (hasClass(target, 'stampable')) {
            return target as HTMLElement;
        }
    }

    // As a fallback, use bounding rect
    const stampable = document.getElementsByClassName('stampable');
    let best: HTMLElement|null = null;
    let bestDist: number = NaN;
    for (let i = 0; i < stampable.length; i++) {
        const elmt = stampable[i];
        const rect = elmt.getBoundingClientRect();
        if (rect.left <= event.clientX && rect.right > event.clientX
                && rect.top <= event.clientY && rect.bottom > event.clientY) {
            if (isTag(elmt, 'path') && pointInPath(elmt, event)) {
                return elmt as HTMLElement;
            }
            const dx = (rect.left + rect.width / 2) - event.clientX;
            const dy = (rect.top + rect.height / 2) - event.clientY;
            const dist = dx*dx + dy*dy;
            if (best == null || dist < bestDist) {
                best = elmt as HTMLElement;
                bestDist = dist;
            }
        }
    }
    if (best) {
        return best;
    }

    // The stampable elements themselves can be size 0, due to absolute positioning.
    // So look for a child.
    if (event.target) {
        const parent = findParentOfClass(event.target as Element, 'stampable');
        if (parent) {
            return parent as HTMLElement
        }
    }

    return null;
}

function pointInPath(elmt: Element, event: PointerEvent): boolean {
    const pathElmt = elmt as SVGPathElement;
    const pathD = pathElmt.getAttribute("d");
    if (!pathD) {
        return false;
    }
    const svg = findParentOfTag(elmt, 'svg') as HTMLElement;
    const bbox = svg.getBoundingClientRect();

    // Create a canvas matching the SVG size
    const canvas = document.createElement("canvas");
    canvas.width = bbox.width;
    canvas.height = bbox.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return false;
    }

    // Convert SVG path to canvas path
    const path = new Path2D(pathD);

    // Adjust mouse coordinates relative to SVG
    const x = event.clientX - bbox.left;
    const y = event.clientY - bbox.top;

    var test = ctx.isPointInPath(path, x, y);
    return test;
}

/**
 * Called when a draw tool is selected from the palette
 * @param event The click event
 */
function onSelectStampTool(event:MouseEvent) {
    const tool = findParentOfClass(event.target as HTMLElement, 'stampTool') as HTMLElement;
    const stampSet = stampSetFromEvent(event);
    const prevToolId = getCurrentStampToolId(stampSet);
    if (tool != null) {
        for (let i = 0; i < stampSet.stampTools.length; i++) {
            toggleClass(stampSet.stampTools[i], 'selected', false);
        }
        if (tool != stampSet.selectedTool) {
            toggleClass(tool, 'selected', true);
            stampSet.selectedTool = tool;
        }
        else {
            stampSet.selectedTool = null;
        }
    }

    const fn = theBoiler().onStampChange;
    if (fn) {
        fn(getCurrentStampToolId(stampSet), prevToolId);
    }
}

/**
 * If the user has any shift key pressed, that trumps all other modes.
 * Else if we have a special erase override, use that.
 * Else if the user selected a drawing tool, then use that.
 * Else use the first tool (presumed default).
 * @param event The click event
 * @param toolFromErase An override because we're erasing/rotating
 * @returns the name of a draw tool
 */
function getStampTool(stampSet:stampSet, event:PointerEvent, toolFromErase:HTMLElement|null):HTMLElement|null {
    // Shift keys always win
    if (event.shiftKey || event.altKey || event.ctrlKey) {
        for (let i = 0; i < stampSet.stampTools.length; i++) {
            const mods = stampSet.stampTools[i].getAttributeNS('', 'data-click-modifier');
            if (mods != null
                    && event.shiftKey == (mods.indexOf('shift') >= 0)
                    && event.ctrlKey == (mods.indexOf('ctrl') >= 0)
                    && event.altKey == (mods.indexOf('alt') >= 0)) {
                return stampSet.stampTools[i];
            }
        }
    }
    
    // toolFromErase is set by how the stamping began.
    // If it begins on a pre-stamped cell, shift to the next stamp.
    // After the first click, subsequent dragging keeps the same tool.
    if (toolFromErase != null) {
        return toolFromErase;
    }

    // Lacking other inputs, use the selected tool.
    if (stampSet.selectedTool != null) {
        return stampSet.selectedTool;
    }

    // If no selection, the first tool is the default
    return stampSet.firstTool;
}

/**
 * A stamp is referenced by the object it was stamped upon.
 * Look up the original stampTool element.
 * @param id The stamp ID
 * @returns An HTMLElement, unless the stamping is malformed.
 */
function getStampToolById(id:string|null):HTMLElement|null {
    return id ? document.getElementById(id) : null;
}

/**
 * Given one tool, currently applied to a target, what is the next stamp in rotation?
 * @package stampSet The set we're part of
 * @param tool The current tool's HTMLElement, or null if none.
 * @returns The next tool's HTMLElement, or else the _firstTool
 */
function getNextStampTool(stampSet:stampSet, tool:HTMLElement|null):HTMLElement|null {
    if (tool) {
        const nextId = tool.getAttributeNS('', 'data-next-stamp-id');
        if (nextId) {
            return document.getElementById(nextId);
        }
        const curIndex = stampSet.stampTools.findIndex((elmt,index) => { return (elmt === tool) });
        // const curIndex = siblingIndexOfClass(stampSet.palette, tool, 'stampTool');
        const nextIndex = (curIndex + 1) % stampSet.stampTools.length;
        return stampSet.stampTools[nextIndex];
    }
    return stampSet.firstTool;
} 

/**
 * Expose current stamp tool, in case other features want to react
 * @package stampSet The set we're part of
 * @returns The ID of a stamp tool, or '' if none selected
 */
export function getCurrentStampToolId(stampSet:stampSet) {
    if (stampSet.selectedTool == null) {
        return '';
    }
    var id = stampSet.selectedTool.id;
    return id || '';
}

/**
 * A stampable element can be the eventual container of the stamp. (example: TD)
 * Or it can assign another element to be the stamp container, with the data-stamp-parent attribute.
 * If present, that field specifies the ID of an element.
 * @param target An element with class="stampable"
 * @returns 
 */
export function getStampParent(target:HTMLElement) {
    const parentId = getOptionalStyle(target, 'data-stamp-parent');
    if (parentId) {
        return document.getElementById(parentId) as HTMLElement;
    }
    return target;
}

/**
 * When drawing on a surface where something is already drawn. The first click
 * always erases the existing drawing.
 * In that case, if the existing drawing was the selected tool, then we are in erase mode.
 * If there is no selected tool, then rotate to the next tool in the palette.
 * Otherwise, return null, to let normal drawing happen.
 * @param target a click event on a stampable object
 * @returns The name of a draw tool (overriding the default), or null
 */
function eraseStamp(stampSet:stampSet, target:HTMLElement):HTMLElement|null {
    if (target == null) {
        return null;
    }
    const parent = getStampParent(target);

    const cur = findFirstChildOfClass(parent, 'stampedObject');
    let curId:string|null;
    if (cur != null) {
        // The target contains a stampedObject, which was injected by a template
        // The tool itself is likely stamped on the parent, but check everywhere
        curId = getOptionalStyle(cur, 'data-stamp-id');
        toggleClass(target, curId, false);
        parent.removeChild(cur);
        parent.removeAttributeNS('', 'data-stamp-id');
        updateStampExtraction(stampSet);
    }
    else if (hasClass(target, 'stampedObject')) {
        // Template is a class on the container itself
        curId = target.getAttributeNS('', 'data-stamp-id');
        toggleClass(target, 'stampedObject', false);
        toggleClass(target, curId, false);
        target.removeAttributeNS('', 'data-stamp-id');
        updateStampExtraction(stampSet);
    }
    else {
        return null;  // This cell is currently blank
    }

    if (stampSet.selectedTool && stampSet.selectedTool.id == curId) {
        // When a tool is explicitly selected, clicking on that type toggles it back off
        return stampSet.eraseTool;
    }
    if (stampSet.selectedTool == null) {
        // If no tool is selected, clicking on anything rotates it to the next tool in the cycle
        if (curId) {
            const curTool = getStampToolById(curId);
            const nextTool = getNextStampTool(stampSet, curTool);
            return nextTool;
        }
    }

    // No guidance on what to replace this cell with
    return null;
}

/**
 * Draw on the target surface, using the named tool.
 * @param target The surface on which to draw
 * @param tool The stampTool object that defines a tool
 * A stampTool can then define behavior in several ways...
 *  - data-template-id       id of a template to instantiate
 *  - data-use-template-id   id of a builder template to use, passing arguments
 *  - data-style             apply the named style(s) to the destination
 *  - data-unstyle           remove the named style(s) from the destination
 *  - data-erase             simply delete the existing contents
 * A stampTool can also define the next element in a rotation
 *  - data-next-id           id of another stampTool
 *                           otherwise it will rotate through stampTools in visual order
 */
export function doStamp(stampSet:stampSet|undefined, target:HTMLElement, tool:HTMLElement) {
    stampSet = stampSet || stampSetFromElement(target);
    const parent = getStampParent(target);
    
    // Template can be null if tool removes drawn objects
    const tmpltId = tool.getAttributeNS('', 'data-template-id');
    const useId = tool.getAttributeNS('', 'data-use-template-id');
    const styles = getOptionalStyle(tool, 'data-style');
    const unstyles = getOptionalStyle(tool, 'data-unstyle');
    const erase = tool.getAttributeNS('', 'data-erase');
    if (tmpltId) {
        let template = document.getElementById(tmpltId) as HTMLTemplateElement;
        if (template === null) {
            throw new Error('Cannot find template "' + tmpltId +'" for stamp ' + tool.id);
        }
        if (template != null) {
            // Inject the template into the stampable container
            const clone = template.content.cloneNode(true);
            parent.appendChild(clone);
        }
        if (tool.id) {
            parent.setAttributeNS('', 'data-stamp-id', tool.id);
        }
    }
    else if (useId) {
        const nodes = useTemplate(tool, useId);
        for (let i = 0; i < nodes.length; i++) {
            parent.appendChild(nodes[i]);
        }
        if (tool.id) {
            parent.setAttributeNS('', 'data-stamp-id', tool.id);
        }
    }
    else if (erase != null) {
        // Do nothing. The caller should already have removed any existing contents
    }

    // Styles can coexist with templates
    if (styles || unstyles) {
        if (tool.id) {
            toggleClass(target, 'stampedObject', true);
            target.setAttributeNS('', 'data-stamp-id', tool.id);
        }
        
        // Remove styles first. That way, the top-level palette can un-style ALL styles,
        // and they will all get removed, prior to re-adding the desired one.
        // That also makes an erase tool cheap or even free (if you don't want an explicit UI).
        if (unstyles) {
            // Remove one or more styles (delimited by spaces)
            // from the target itself. NOT to some parent stampable object.
            // No parent needed if we're not injecting anything.
            clearAllClasses(target, unstyles);
        }    
        if (styles) {
            // Apply one or more styles (delimited by spaces)
            // to the target itself. NOT to some parent stampable object.
            // No parent needed if we're not injecting anything.
            applyAllClasses(target, styles);
        }
    }

    updateStampExtraction(stampSet);
    saveStampingLocally(target);

    const fn = theBoiler().onStamp;
    if (fn) {
        fn(target);
    }
}

let _dragDrawTool:HTMLElement|null = null;
let _lastDrawTool:HTMLElement|null = null;

/**
 * Draw where a click happened.
 * Which tool is taken from selected state, click modifiers, and current target state.
 * @param event The mouse click
 */
function onClickStamp(stampSet:stampSet, event:PointerEvent, target:HTMLElement) {
    let nextTool = eraseStamp(stampSet, target);
    nextTool = getStampTool(stampSet, event, nextTool);
    if (nextTool) {
        doStamp(stampSet, target, nextTool);   
    }
    _lastDrawTool = nextTool;
    _dragDrawTool = null;
}

function isPrimaryButton(event:PointerEvent) {
    return event.pointerType != 'mouse' || event.buttons == 1;
}

/**
 * Continue drawing when the mouse is dragged, using the same tool as in the cell we just left.
 * @param event The mouse enter event
 */
function onMoveStamp(stampSet:stampSet, event:PointerEvent, target:HTMLElement) {
    if (_dragDrawTool != null) {
        eraseStamp(stampSet, target);
        doStamp(stampSet, target, _dragDrawTool);
        _dragDrawTool = null;
    }
}

/**
 * When dragging a drawing around, copy each cell's drawing to the next one.
 * As the mouse leaves one surface, note which tool is used there.
 * If dragging unrelated to drawing, flag the coming onMoveStamp to do nothing.
 * @param event The mouse leave event
 */
function preMoveStamp(stampSet:stampSet, event:PointerEvent, target:HTMLElement) {
    if (target != null) {
        const cur = findFirstChildOfClass(target, 'stampedObject');
        if (cur != null) {
            const stampId = getOptionalStyle(cur, 'data-stamp-id');
            _dragDrawTool = stampId ? document.getElementById(stampId) : null;
        }
        else {
            _dragDrawTool = _lastDrawTool;
        }
    }
    else {
        _dragDrawTool = null;
    }
}

/**
 * Drawing tools can be flagged to do extraction.
 */
function updateStampExtraction(stampSet:stampSet) {
    if (!stampSet.extractorTool) {
        return;
    }
    const extracted = document.getElementById(stampSet.extractedId || 'extracted');
    if (extracted != null) {
        const stampable = stampSet.container 
            ? stampSet.container.getElementsByClassName('stampable')
            : document.getElementsByClassName('stampable');
        let extraction = '';
        for (let i = 0; i < stampable.length; i++) {
            const stamp = stampable[i] as HTMLElement;
            const tool = getOptionalStyle(stamp, 'data-stamp-id');
            if (tool == stampSet.extractorTool.id) {
                const extract = findFirstChildOfClass(stamp, 'extract') as HTMLElement;
                if (extract) {
                    extraction += extract.innerText;
                }
            }
        }

        if (extracted.tagName != 'INPUT') {
            extracted.innerText = extraction;
        }
        else {
            let inp = extracted as HTMLInputElement;
            inp.value = extraction;    
        }
    }
}