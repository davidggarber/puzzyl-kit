import { getParentIf } from "./builder";
import { cloneText, complexAttribute } from "./builderContext";
import { hasInputGroup, setCurrentInputGroup } from "./textInput";

/**
 * Add or remove a class from a classlist, based on a boolean test.
 * @param obj - A page element, or id of an element
 * @param cls - A class name to toggle (unless null)
 * @param bool - If omitted, cls is toggled in the classList; if true, cls is added; if false, cls is removed
 */
export function toggleClass(obj: Node|string|null|undefined, 
                            cls: string|null, 
                            bool?: boolean) {
    const elmt = getElement(obj);
    if (!elmt || !cls) {
        return;
    }
    if (elmt !== null && elmt.classList !== null) {
        if (bool === undefined) {
            bool = !elmt.classList.contains(cls);
        }
        if (bool) {
            elmt.classList.add(cls);
        }
        else {
            elmt.classList.remove(cls);
            if (elmt.classList.length == 0) {
                elmt.removeAttribute('class');
            }
        }
    }
}

/**
 * Find all elements with this class, and remove from each.
 * @param cls A class name
 */
export function removeClassGlobally(cls: string) {
    const elmts = document.getElementsByClassName(cls);
    for (let i = elmts.length-1; i >= 0; i--) {  // Backwards
        elmts[i].classList.remove(cls);
    }
}

/**
 * Several utilities allow an element to be passed as either a pointer,
 * or by its ID, or omitted completely.
 * Resolve to the actual pointer, if possible.
 * @param obj An element pointer, ID (string), or null/undefined
 * @returns The actual element, or else null
 */
function getElement(obj: Node|string|null|undefined):Element|null {
    if (!obj) {
        return null;
    }
    if ('string' === typeof obj) {
        return document.getElementById(obj as string) as Element;
    }
    return obj as Element;
}

/**
 * Check if an HTML element is tagged with a given CSS class
 * @param obj - A page element, or id of an element
 * @param cls - A class name to test
 * @returns true iff the class is in the classList
 */
export function hasClass( obj: Node|string|null, 
                          cls: string|undefined) 
                          : boolean {
    const elmt = getElement(obj);
    if (!elmt || !cls) {
        return false;
    }
    return elmt !== null 
        && elmt.classList
        && elmt.classList.contains(cls);
}

/**
 * Apply all classes in a list of classes.
 * @param obj - A page element, or id of an element
 * @param classes - A list of class names, delimited by spaces
 */
export function applyAllClasses(obj: Node|string, 
                                classes:string) {
    var list = classes.split(' ');
    for (let cls of list) {
        toggleClass(obj, cls, true);
    }
}

/**
 * Convert the classList to a simple array of strings
 * @param obj A page element, or id of an element
 * @returns a string[]
 */
export function getAllClasses(obj: Node|string):string[] {
    const elmt = getElement(obj) as Element;
    const list:string[] = [];
    elmt.classList.forEach((s,n) => list.push(s));
    return list;
}

/**
 * Apply all classes in a list of classes.
 * @param obj - A page element, or id of an element
 * @param classes - A list of class names, delimited by spaces
 */
export function clearAllClasses(obj: Node|string, 
                                classes?:string|string[]) {
    const elmt = getElement(obj) as Element;
    let list:string[] = [];
    if (!classes) {
        elmt.classList.forEach((s,n) => list.push(s));
    }
    else if (typeof(classes) == 'string') {
        list = classes.split(' ');
    }
    else {
        list = classes as string[];
    }
    for (let cls of list) {
        toggleClass(obj, cls, false);
    }
}

/**
 * Given one element, find the next one in the document that matches the desired class
 * @param current - An existing element
 * @param matchClass - A class that this element has
 * @param skipClass - [optional] A class of siblings to be skipped
 * @param dir - 1 (default) finds the next sibling, else -1 finds the previous
 * @returns A sibling element, or null if none is found
 */
export function findNextOfClass(current: Element, 
                                matchClass: string, 
                                skipClass?: string, 
                                dir: number = 1)
                                : Element|null {
    var inputs = document.getElementsByClassName(matchClass);
    var found = false;
    for (let i = dir == 1 ? 0 : inputs.length - 1; i >= 0 && i < inputs.length; i += dir) {
        if (skipClass != undefined && hasClass(inputs[i], skipClass)) {
            continue;
        }
        if (found) {
            return inputs[i];
        }
        found = inputs[i] == current;
    }
    return null;
}

/**
 * Find the index of the current element among the siblings under its parent
 * @param current - An existing element
 * @param parentObj - A parent element (or the class of a parent)
 * @param sibClass - A class name shared by current and siblings
 * @returns - The index, or -1 if current is not found in the specified parent
 */
export function indexInContainer( current: Element, 
                                  parentObj: Element|string, 
                                  sibClass: string) {
    let parent: Element;
    if (typeof(parentObj) == 'string') {
        parent = findParentOfClass(current, parentObj as string) as Element;
    }
    else {
        parent = parentObj as Element;
    }
    var sibs = parent.getElementsByClassName(sibClass);
    for (let i = 0; i < sibs.length; i++) {
        if (sibs[i] === current) {
            return i;
        }
    }
    return -1;
}

/**
 * Get the index'ed child element within this parent
 * @param parent - An existing element
 * @param childClass - A class of children under parent
 * @param index - The index of the desired child. A negative value counts back from the end
 * @returns The child element, or null if no children
 */
export function childAtIndex( parent: Element, 
                              childClass: string, 
                              index: number)
                              : Element|null {
    var sibs = parent.getElementsByClassName(childClass);
    if (index < 0) {
        index = sibs.length + index;
    }
    else if (index >= sibs.length) {
        index = sibs.length - 1;
    }
    if (index < 0) {
        return null;
    }
    return sibs[index];
}

/**
 * Given an input in one container, find an input in the next container
* @param current - the reference element
* @param matchClass - the class we're looking for
* @param skipClass - a class we're avoiding
* @param containerClass - the parent level to go up to, before coming back down
* @param dir - 1 (default) to go forward, -1 to go back
*/
export function findInNextContainer(current: Element, 
                                    matchClass: string, 
                                    skipClass: string|undefined, 
                                    containerClass: string, 
                                    dir: number = 1)
                                    : Element|null {
    var container = findParentOfClass(current, containerClass);
    if (container == null) {
        return null;
    }
    var nextContainer = findNextOfClass(container, containerClass, undefined, dir);
    while (nextContainer != null) {
        var child = findFirstChildOfClass(nextContainer, matchClass, skipClass);
        if (child != null) {
            return child;
        }
        // Look further ahead
        nextContainer = findNextOfClass(nextContainer, containerClass, undefined, dir);
    }
    return null;
}

/**
 * Find either the first or last sibling element under a parent
* @param current - the reference element
* @param matchClass - the class we're looking for
* @param skipClass - a class we're avoiding
* @param containerClass - the parent level to go up to, before coming back down
* @param dir - 1 (default) to go forward, -1 to go back
* @returns The first or last sibling element, or null if no matches
 */
export function findEndInContainer( current: Element, 
                                    matchClass: string, 
                                    skipClass: string|undefined, 
                                    containerClass: string, 
                                    dir: number = 1) {
    var container = findParentOfClass(current, containerClass);
    if (container == null) {
        return null;
    }
    return findFirstChildOfClass(container, matchClass, skipClass, dir);
}

/**
 * Check whether a node, i.e. from elem.parentNode, is an element.
 * @param node Any node, or null|undefined (which would both return false)
 * @returns true for elements
 */
export function isElement(node:Node|null|undefined): boolean {
    return node != undefined 
        && node != null 
        && node.nodeType === Node.ELEMENT_NODE;
}

/**
 * Check whether a node, i.e. from elem.parentNode, is an HTML element.
 * @param node Any node, or null|undefined (which would both return false)
 * @returns true for HTML elements
 */
export function isHTMLElement(node:Node|null|undefined): boolean {
    return isElement(node) && node instanceof HTMLElement;
}

/**
 * Determine the tag type, based on the tag name (case-insenstive)
 * @param elmt An HTML element
 * @param tag a tag name, or array of names
 */
export function isTag(elmt: Element|null, tag: string|string[]) {
    if (!elmt) { 
        return false;
    }

    const tagName = elmt.tagName.toUpperCase();
    if (typeof(tag) == 'string') {
        return tagName == tag.toUpperCase();
    }
    const tags = tag as string[];
    for (let i = 0; i < tags.length; i++) {
        if (tagName == tags[i].toUpperCase()) {
            return true;
        }
    }
    return false;
}

/**
 * Find the nearest containing node that contains the desired class.
 * @param elmt - An existing element
 * @param parentClass - A class name of a parent element
 * @returns The nearest matching parent element, up to but not including the body
 */
export function findParentOfClass(elmt: Element, 
                                  parentClass: string)
                                  : Element|null {
    if (parentClass == null || parentClass == undefined) {
        return null;
    }
    while (elmt !== null && !isTag(elmt, 'body')) {
        if (hasClass(elmt, parentClass)) {
            return elmt;
        }
        if (elmt.parentNode === document) {
            return null;
        }
        elmt = elmt.parentNode as Element;
    }
    return null;
}

/**
 * Is the element anywhere underneath parent (including itself)
 * @param elmt An element
 * @param parent An element
 * @returns true if parent is anywhere in elmt's parent chain
 */
export function isSelfOrParent(elmt: Element, parent: Element) {
    while (elmt !== null && !isTag(elmt, 'body')) {
        if (elmt === parent) {
            return true;
        }
        if (elmt.parentNode === document) {
            return null;
        }
        elmt = elmt.parentNode as Element;
    }
    return false;
}

/**
 * Find the nearest containing node of the specified tag type.
 * @param elmt - An existing element
 * @param parentTag - A tag name of a parent element
 * @returns The nearest matching parent element, up to and including the body
 */
export function findParentOfTag(elmt: Element, parentTag: string)
                                : Element|null {
    if (parentTag == null || parentTag == undefined) {
        return null;
    }
    parentTag = parentTag.toUpperCase();
    while (elmt !== null) {
        const name = elmt.tagName.toUpperCase();
        if (name === parentTag) {
            return elmt;
        }
        if (name === 'BODY') {
            break;
        }
        if (elmt.parentNode === document) {
            return null;
        }
        elmt = elmt.parentNode as Element;
    }
    return null;
}

/**
 * Find the first child/descendent of the current element which matches a desired class
 * @param elmt - A parent element
 * @param childClass - A class name of the desired child
 * @param skipClass - [optional] A class name to avoid
 * @param dir - If positive (default), search forward; else search backward
 * @returns A child element, if a match is found, else null
 */
export function findFirstChildOfClass(  elmt: Element, 
                                        childClass: string, 
                                        skipClass: string|undefined = undefined,
                                        dir: number = 1)
                                        : Element|null {
    var children = elmt.getElementsByClassName(childClass);
    for (let i = dir == 1 ? 0 : children.length - 1; i >= 0 && i < children.length; i += dir) {
        if (skipClass !== null && hasClass(children[i], skipClass)) {
            continue;
        }
        return children[i];
    }
    return null;
}

/**
 * Find the first child/descendent of the current element which matches a desired class
 * @param parent - A parent element
 * @param childClass - A class name of the desired child
 * @param index - Which child to find. If negative, count from the end
 * @returns A child element, if a match is found, else null
 */
export function findNthChildOfClass(  parent: Element, 
    childClass: string, 
    index: number)
    : Element|null {
    var children = parent.getElementsByClassName(childClass);
    if (index >= 0) {
        return (index < children.length) ? children[index] : null;
    }
    else {
        index = children.length + index;
        return (index >= 0) ? children[index] : null;
    }
}

/**
 * Get the index of an element among its siblings.
 * @param parent A parent/ancestor of the child
 * @param child Any element of type childClass
 * @param childClass A class that defines the group of siblings
 * @returns The index, or -1 if there's an error (the child is not in fact inside the specified parent)
 */
export function siblingIndexOfClass(parent: Element, child: Element, childClass: string): number {
    var children = parent.getElementsByClassName(childClass);
    for (let i = 0; i < children.length; i++) {
        if (children[i] == child) {
            return i;
        }
    }
    return -1;
}

/**
 * Look for any attribute in the current tag, and all parents (up to, but not including, body)
 * @param elmt - A page element
 * @param attrName - An attribute name
 * @param defaultStyle - (optional) The default value, if no tag is found with the attribute. Null if omitted.
 * @param prefix - (optional) - A prefix to apply to the answer
 * @returns The found or default style, optional with prefix added
 */
export function getOptionalStyle(   elmt: Element|null, 
                                    attrName: string, 
                                    defaultStyle?: string, 
                                    prefix?: string)
                                    : string|null {
    if (!elmt) {
        return null;
    }
    const e = getParentIf(elmt, (e)=>e.getAttribute(attrName) !== null && cloneText(e.getAttribute(attrName), false) !== '');
    let val = e ? e.getAttribute(attrName) : null;
    val = val !== null ? cloneText(val, false) : (defaultStyle || null);
    return (val === null || prefix === undefined) ? val : (prefix + val);
}

/**
 * Look for any attribute in the current tag, and all parents (up to, but not including, body)
 * @param elmt - A page element
 * @param attrName - An attribute name
 * @returns The found data, parsed as a complext attribute
 */
export function getOptionalComplex( elmt: Element|null, 
                                    attrName: string)
                                    : any {
    if (!elmt) {
        return null;
    }
    const e = getParentIf(elmt, (e)=>e.getAttribute(attrName) !== null);
    const val = e ? e.getAttribute(attrName) : null;
    return val !== null ? complexAttribute(val) : null;
}

/**
 * Loop through all elements in a DOM sub-tree, looking for any elements with an optional tag.
 * Recurse as needed. But once found, don't recurse within the find.
 * @param root The node to look through. Can also be 'document'
 * @param attr The name of an attribute. It must be present and non-empty to count
 * @returns A list of zero or more elements
 */
export function getAllElementsWithAttribute(root: Node, attr:string):HTMLElement[] {
    const list:HTMLElement[] = [];
    for (let i = 0; i < root.childNodes.length; i++) {
        const child = root.childNodes[i];
        if (child.nodeType == Node.ELEMENT_NODE) {
            const elmt = child as HTMLElement;
            if (elmt.getAttribute(attr)) {
                list.push(elmt);
                // once found, don't recurse
            }
            else {
                const recurse = getAllElementsWithAttribute(elmt, attr);
                for (let r = 0; r < recurse.length; r++) {
                    list.push(recurse[r]);
                }
            }
        }
    }
    return list;
}

/**
 * Move focus to the given field (if not null), and select the entire contents.
 * If field is of type number, do nothing.
 * @param field - A form field element
 * @param caret - The character index where the caret should go
 * @returns true if the field element and caret position are valid, else false
 */
export function moveFocus(field: HTMLElement, 
                          caret?: number)
                          : boolean {
    if (field !== null) {
        field.focus();
        if (isTag(field, 'input') || isTag(field, 'textarea')) {
            const input = field as HTMLInputElement|HTMLTextAreaElement;
            if (input.type !== 'number') {
                if (caret === undefined) {
                    input.setSelectionRange(0, input.value.length);
                }
                else {
                    input.setSelectionRange(caret, caret);
                }
            }
        }
        if (isArrowKeyElement(field) && hasInputGroup(field)) {
            setCurrentInputGroup(field as ArrowKeyElement);
        }
        return true;
    }
    return false;
}

/**
 * Sort a collection of elements into an array
 * @param src A collection of elements, as from document.getElementsByClassName
 * @param sort_attr The name of the optional attribute, by which we'll sort. Attribute values must be numbers.
 * @returns An array of the same elements, either sorted, or else in original document order
 */
export function SortElements(src:HTMLCollectionOf<Element>, sort_attr:string = 'data-extract-order'): Element[] {
    const lookup:Record<string, any> = {};
    const indeces:string[] = [];
    const sorted:Element[] = [];
    for (let i = 0; i < src.length; i++) {
        const elmt = src[i];
        const order = getOptionalStyle(elmt, sort_attr);
        if (order) {
            // track order values we've seen
            if (!(order in lookup)) {
                indeces.push(order);
                lookup[order] = [];
            }
            // make elements findable by their order
            lookup[order].push(elmt);
        }
        else {
            // elements without an explicit order go document order
            sorted.push(elmt);
        }
    }

    // Sort indeces, then build array from them
    indeces.sort((a,b) => sortableIndex(a) < sortableIndex(b) ? -1 : 1);
    for (let i = 0; i < indeces.length; i++) {
        const order = '' + indeces[i];
        const peers = lookup[order];
        for (let p = 0; p < peers.length; p++) {
            sorted.push(peers[p]);
        }
    }

    return sorted;
}

/**
 * Most x are the numeric index into an extraction.
 * But there's support for alphabetic indexing too.
 * @param x the index.
 * @returns A number that can be compared.
 */
function sortableIndex(x:string):number {
    let n = parseInt(x);
    return isNaN(n) ? x.charCodeAt(0) : n;
}

/**
 * Some abilities are hooked to either a single element with a predefined ID,
 * or a set of elements with a prefined class.
 * Usually, this is a v1 and v2, where the ID is supported as backwards compat.
 * @param cls An element class
 * @param id An element ID, unique in the document
 * @param parent If present, constrain class search to that parent, 
 * else look document-wide. The ID is always documet-wide.
 * @returns A list of matching elements. The ID, if found, is first.
 */
export function getElementsByClassOrId(cls:string, id?:string, parent?:Element):Element[] {
    const list:Element[] = [];
    
    let byId:HTMLElement|null = null;
    if (id) {
        byId = document.getElementById(id);
        if (byId) {
            list.push(byId);
        }
    }

    if (parent && hasClass(parent, cls)) {
        list.push(parent);
    }
    
    const byClass = parent ? parent.getElementsByClassName(cls)
        : document.getElementsByClassName(cls);
    for (let i = 0; i < byClass.length; i++) {
        const elmt = byClass[i];
        if (elmt != byId) {
            list.push(elmt);
        }
    }
    return list;
}

export type TextInputElement = HTMLInputElement | HTMLTextAreaElement;
export type ArrowKeyElement = TextInputElement | HTMLSelectElement | HTMLButtonElement;

export function isTextInputElement(elmt:Element|undefined|null):boolean {
    return elmt ? (isTag(elmt, 'input') || isTag(elmt, 'textarea')) : false;
}
export function isArrowKeyElement(elmt:Element|undefined|null):boolean {
    return elmt ? (isTextInputElement(elmt) || isTag(elmt, 'select') || isTag(elmt, 'button')) : false;
}

/**
 * Retrieve the local transform from an element.
 * This ignores any chain of additional transforms above the element.
 * @param element Any element.
 * @returns A matrix. Will be the identity if no transform applied.
 */
export function matrixFromElement(element:Element): DOMMatrix {
    const computed = getComputedStyle(element).transform;
    if (computed == 'none') {
        return new DOMMatrix();  // Identity matrix
    }
    return new DOMMatrix(computed);
}

/**
 * Find the nearest common ancestor of two elements.
 * This could be a or b, if one is inside the other, or else any element up to the body.
 * @param a Any Element in the document
 * @param b Any Element in the document
 * @returns Another Element
 */
export function mutualAncestor(a:Element, b:Element): Element|null {
    const ancestors:Element[] = [];
    let aa:Node|null = a;
    while (isElement(aa) && !isTag(aa as Element, 'body')) {
        ancestors.push(aa as Element);
        aa = (aa as Node).parentNode;
    }
    let bb:Node|null = b;
    while (isElement(bb) && !isTag(bb as Element, 'body')) {
        if (ancestors.indexOf(bb as Element) >= 0) {
            return bb as Element;
        }
        bb = (bb as Node).parentNode;
    }
    
    // Surely they are both contained by the body!
    console.error("No common ancestor found! Are these elements in the same document?");
    return null;
}

/**
 * Determine the order of this element within its siblings
 * @param elem Any element
 * @returns 0 to element.parentNode.childNodes.length - 1
 */
export function getChildOrder(elem: Element): number {
    const parent = elem.parentNode;
    for (let i = 0; i < parent!.childNodes.length; i++) {
        if (parent?.childNodes[i] == elem) {
            return i;
        }
    }
    throw new Error(`Cannot find ${elem} order within ${parent}`);
}

/**
 * Moves an element within its siblings, to a new index
 * @param elem The element to move
 * @param index The desired index, or -1 for last
 */
export function moveChildOrder(elem: Element, index: number):void {
    const parent = elem.parentNode;
    parent?.removeChild(elem);
    if (index == -1 || index >= parent!.childNodes.length) {
        parent?.appendChild(elem);
        return;
    }
    const sibling = parent!.childNodes[index];
    parent?.insertBefore(elem, sibling);
}