import { findFirstChildOfClass, findParentOfClass, getElementsByClassOrId, hasClass, isSelfOrParent, toggleClass } from "./classUtil";
import { saveContainerLocally, savePositionLocally } from "./storage";

export type Position = {
    x: number;
    y: number;
}

/**
 * Convert an element's left/top style to a position
 * @param elmt Any element with a style
 * @returns A position
 */
export function positionFromStyle(elmt:HTMLElement): Position {
    return { x: parseInt(elmt.style.left), y: parseInt(elmt.style.top) };
}

// VOCABULARY
// moveable: any object which can be clicked on to begin a move
// drop-target: a container that can receive a (single) moveable element
// drag-source: a container that can hold a single spare moveable element

/**
 * Scan the page for anything marked moveable, drag-source, or drop-target
 * Those items get click handlers
 */
export function preprocessDragFunctions() {
    let elems = document.getElementsByClassName('moveable');
    for (let i = 0; i < elems.length; i++) {
        preprocessMoveable(elems[i] as HTMLElement);
    }

    elems = document.getElementsByClassName('drop-target');
    for (let i = 0; i < elems.length; i++) {
        preprocessDropTarget(elems[i] as HTMLElement);
    }

    elems = document.getElementsByClassName('free-drop');
    for (let i = 0; i < elems.length; i++) {
        const elem = elems[i] as HTMLElement;
        preprocessFreeDrop(elem);

        // backward-compatible
        if (hasClass(elem, 'z-grow-up')) {
            elem.setAttributeNS('', 'data-z-grow', 'up');
        }
        else if (hasClass(elem, 'z-grow-down')) {
            elem.setAttributeNS('', 'data-z-grow', 'down');
        }
        initFreeDropZorder(elem);
    }
}

/**
 * Similar to pre-process, but a special case when the draggable
 * elements show up after the initial page setup.
 * @param container An element which is or contains 'moveable', 
 * and other drag-drop artifacts.
 */
export function postprocessDragFunctions(container:HTMLElement) {
    let elems = getElementsByClassOrId('moveable', undefined, container);
    for (let i = 0; i < elems.length; i++) {
        preprocessMoveable(elems[i] as HTMLElement);
    }

    elems = getElementsByClassOrId('drop-target', undefined, container);
    for (let i = 0; i < elems.length; i++) {
        preprocessDropTarget(elems[i] as HTMLElement);
    }

    elems = getElementsByClassOrId('free-drop', undefined, container);
    for (let i = 0; i < elems.length; i++) {
        const elem = elems[i] as HTMLElement;
        preprocessFreeDrop(elem);

        // backward-compatible
        if (hasClass(elem, 'z-grow-up')) {
            elem.setAttributeNS('', 'data-z-grow', 'up');
        }
        else if (hasClass(elem, 'z-grow-down')) {
            elem.setAttributeNS('', 'data-z-grow', 'down');
        }
        initFreeDropZorder(elem);
    }
}

/**
 * Hook up the necessary mouse events to each moveable item
 * @param elem a moveable element
 */
function preprocessMoveable(elem:HTMLElement) {
    var xmlns = elem.namespaceURI;
    if (xmlns != "http://www.w3.org/1999/xhtml") {  // This is both HTML and XHTML
        console.error("WARNING: non-HTML elements are not draggable: " + elem.localName)
    }

    elem.setAttribute('draggable', 'true');
    elem.onpointerdown=function(e){onClickDrag(e)};
    elem.ondrag=function(e){onDrag(e)};
    elem.ondragend=function(e){onDragDrop(e)};
}

/**
 * Hook up the necessary mouse events to each drop target
 * @param elem a drop-target element
 */
function preprocessDropTarget(elem:HTMLElement) {
    elem.onpointerup=function(e){onClickDrop(e)};
    elem.ondragenter=function(e){onDropAllowed(e)};
    elem.ondragover=function(e){onDropAllowed(e)};
    elem.onpointermove=function(e){onTouchDrag(e)};
}

/**
 * Hook up the necessary mouse events to each free drop target
 * @param elem a free-drop element
 */
function preprocessFreeDrop(elem:HTMLElement) {
    elem.onpointerdown=function(e){doFreeDrop(e)};
    elem.ondragenter=function(e){onDropAllowed(e)};
    elem.ondragover=function(e){onDropAllowed(e)};
}

/**
 * Assign z-index values to all moveable objects within a container.
 * Objects' z index is a function of their y-axis, and can extend up or down.
 * @param container The free-drop container, which can contain a data-z-grow attribute
 */
export function initFreeDropZorder(container:HTMLElement) {
    const zGrow = container.getAttributeNS('', 'data-z-grow')?.toLowerCase();
    if (!zGrow || (zGrow != 'up' && zGrow != 'down')) {
        return;
    }
    const zUp = zGrow == 'up';
    const height = container.getBoundingClientRect().height;
    const children = container.getElementsByClassName('moveable');
    for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        let z = parseInt(child.style.top);  // will always be in pixels, relative to the container
        z = 1000 + (zUp ? (height - z) : z);
        child.style.zIndex = String(z);
    }
}

/**
 * The most recent object to be moved
 */
let _priorDrag:HTMLElement|null = null;
/**
 * The object that is selected, if any
 */
let _dragSelected:HTMLElement|null = null;
/**
 * The drop-target over which we are dragging
 */
let _dropHover:HTMLElement|null = null;
/**
 * The position within its container that a dragged object was in before dragging started
 */
let _dragPoint:Position|null = null;

/**
 * Pick up an object
 * @param obj A moveable object
 */
function pickUp(obj:HTMLElement) {
    _priorDrag = _dragSelected;
    if (_dragSelected != null && _dragSelected != obj) {
        toggleClass(_dragSelected, 'drag-selected', false);
        _dragSelected = null;
    }
    if (obj != null && obj != _dragSelected) {
        _dragSelected = obj;
        toggleClass(_dragSelected, 'displaced', false);  // in case from earlier
        toggleClass(_dragSelected, 'placed', false);
        toggleClass(_dragSelected, 'drag-selected', true);
    }
}

/**
 * Drop the selected drag object onto a destination
 * If something else is already there, it gets moved to an empty drag source
 * Once complete, nothing is selected.
 * @param dest The target of this drag action
 */
function doDrop(dest:HTMLElement|null) {
    if (!_dragSelected) {
        return;
    }
    
    let src = getDragSource();
    if (dest === src) {
        if (_priorDrag !== _dragSelected) {
            // Don't treat the first click of a 2-click drag
            // as a 1-click non-move.
            return;
        }
        // 2nd click on src is equivalent to dropping no-op
        dest = null;
    }

    let other:Element|null = null;
    if (dest != null) {
        other = findFirstChildOfClass(dest, 'moveable', undefined, 0);
        if (other != null) {
            dest.removeChild(other);
        }
        src?.removeChild(_dragSelected);
        dest.appendChild(_dragSelected);
        saveContainerLocally(_dragSelected, dest);
    }

    toggleClass(_dragSelected, 'placed', true);
    toggleClass(_dragSelected, 'drag-selected', false);
    _dragSelected = null;
    _dragPoint = null;

    if (_dropHover != null) {
        toggleClass(_dropHover, 'drop-hover', false);
        _dropHover = null;
    }

    if (other != null) {
        // Any element that was previous at dest swaps places
        toggleClass(other, 'placed', false);
        toggleClass(other, 'displaced', true);
        if (!hasClass(src, 'drag-source')) {
            // Don't displace to a destination if an empty source is available
            const src2 = findEmptySource();
            if (src2 != null) {
                src = src2;
            }
        }
        src?.appendChild(other);
        saveContainerLocally(other as HTMLElement, src as HTMLElement);
    }
}

/**
 * Drag the selected object on a region with flexible placement.
 * @param event The drop event
 */
function doFreeDrop(event:MouseEvent) {
    if (_dragPoint == null 
            || (event.clientX == _dragPoint.x && event.clientY == _dragPoint.y && _priorDrag == null)) {
        // This is the initial click
        return;
    }
    if (_dragSelected != null) {
        const dx = event.clientX - _dragPoint.x;
        const dy = event.clientY - _dragPoint.y;
        const oldLeft = parseInt(_dragSelected.style.left);
        const oldTop = parseInt(_dragSelected.style.top);
        _dragSelected.style.left = (oldLeft + dx) + 'px';
        _dragSelected.style.top = (oldTop + dy) + 'px';

        updateZ(_dragSelected, oldTop + dy);
        savePositionLocally(_dragSelected);
        doDrop(null);
    }
}

/**
 * When an object is dragged in a container that holds multiple items,
 * the z-order can change. Use the relative y position to set z-index.
 * @param elem The element whose position just changed
 * @param y The y-offset of that element, within its free-drop container
 */
function updateZ(elem:HTMLElement, y:number) {
    let dest = findParentOfClass(elem, 'free-drop') as HTMLElement;
    const zGrow = dest?.getAttributeNS('', 'data-z-grow')?.toLowerCase();
    if (zGrow == 'down') {
        elem.style.zIndex = String(1000 + y);
    }
    else if (zGrow == 'up') {
        const rect = dest.getBoundingClientRect();
        elem.style.zIndex = String(1000 + rect.height - y);
    }
}

/**
 * The drag-target or drag-source that is the current parent of the dragging item
 * @returns 
 */
function getDragSource():HTMLElement|null {
    if (_dragSelected != null) {
        let src = findParentOfClass(_dragSelected, 'drop-target') as HTMLElement;
        if (src == null) {
            src = findParentOfClass(_dragSelected, 'drag-source') as HTMLElement;
        }
        if (src == null) {
            src = findParentOfClass(_dragSelected, 'free-drop') as HTMLElement;
        }
        return src;
    }
    return null;
}

/**
 * Initialize a drag with mouse-down
 * This may be the beginning of a 1- or 2-click drag action
 * @param event The mouse down event
 */
function onClickDrag(event:MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target || target.tagName == 'INPUT') {
        return;
    }
    const obj = findParentOfClass(target, 'moveable') as HTMLElement;
    if (obj != null) {
        if (_dragSelected == null) {
            pickUp(obj);
            _dragPoint = {x: event.clientX, y: event.clientY};
        }
        else if (obj == _dragSelected) {
            // 2nd click on this object - enable no-op drop
            _priorDrag = obj;
        }
    }
}

/**
 * Conclude a drag with the mouse up
 * @param event A mouse up event
 */
function onClickDrop(event:PointerEvent) {
    const target = event.target as HTMLElement;
    if (!target || target.tagName == 'INPUT') {
        return;
    }
    if (_dragSelected != null) {
        let dest = findParentOfClass(target, 'drop-target') as HTMLElement;
        if (event.pointerType == 'touch') {
            // Touch events' target is really the source. Need to find target
            let pos = document.elementFromPoint(event.clientX, event.clientY);
            if (pos) {
                pos = findParentOfClass(pos, 'drop-target');
                if (pos) {
                    dest = pos as HTMLElement;
                }
            }    
        }
        doDrop(dest);
    }
}

/**
 * Conlcude a drag with a single drag-move-release.
 * We we released over a drop-target or free-drop element, make the move.
 * @param event The mouse drag end event
 */
function onDragDrop(event:MouseEvent) {
    const elem = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
    let dest = findParentOfClass(elem, 'drop-target') as HTMLElement;
    if (dest) {
        doDrop(dest);
    }
    else {
        dest = findParentOfClass(elem, 'free-drop') as HTMLElement;
        if (dest) {
            doFreeDrop(event);
        }
    }    
}

/**
 * As a drag is happening, highlight the destination
 * @param event The mouse drag start event
 */
function onDrag(event:MouseEvent) {
    if (event.screenX == 0 && event.screenY == 0) {
        return;  // not a real event; some extra fire on drop
    }
    const elem = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
    const dest = findParentOfClass(elem, 'drop-target') as HTMLElement;
    if (dest != _dropHover) {
        toggleClass(_dropHover, 'drop-hover', false);

        const src = getDragSource();
        if (dest != src) {
            toggleClass(dest, 'drop-hover', true);
            _dropHover = dest;
        }
    }    
}

/**
 * Touch move events should behave like drag.
 * @param event Any pointer move, but since we filter to touch, they must be dragging
 */
function onTouchDrag(event:PointerEvent) {
    if (event.pointerType == 'touch') {
        console.log('touch-drag to ' + event.x + ',' + event.y);
        onDrag(event);
    }
}

/**
 * As a drag is happening, make the cursor show valid or invalid targets
 * @param event A mouse hover event
 */
function onDropAllowed(event:MouseEvent) {
    const elem = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
    let dest = findParentOfClass(elem, 'drop-target');
    if (dest == null) {
        dest = findParentOfClass(elem, 'free-drop');
    }
    if (_dragSelected != null && dest != null) {
        event.preventDefault();
    }
}

/**
 * Find a drag-source that is currently empty.
 * Called when a moved object needs to eject another occupant.
 * @returns An un-occuped drag-source, if one can be found
 */
function findEmptySource():HTMLElement|null {
    const elems = document.getElementsByClassName('drag-source');
    for (let i = 0; i < elems.length; i++) {
        if (findFirstChildOfClass(elems[i], 'moveable', undefined, 0) == null) {
            return elems[i] as HTMLElement;
        }
    }
    // All drag sources are occupied
    return null;
}

/**
 * Move an object to a destination.
 * @param moveable The object to move
 * @param destination The container to place it in
 */
export function quickMove(moveable:HTMLElement, destination:HTMLElement) {
    if (moveable != null && destination != null && !isSelfOrParent(moveable, destination)) {
        pickUp(moveable);
        doDrop(destination);    
    }
}

/**
 * Move an object within a free-move container
 * @param moveable The object to move
 * @param position The destination position within the container
 */
export function quickFreeMove(moveable:HTMLElement, position:Position) {
    if (moveable != null && position != null) {
        moveable.style.left = position.x + 'px';
        moveable.style.top = position.y + 'px';
        updateZ(moveable, position.y);
        toggleClass(moveable, 'placed', true);
    }
}