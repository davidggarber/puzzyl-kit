/**
 * Add or remove a class from a classlist, based on a boolean test.
 * @param obj - A page element, or id of an element
 * @param cls - A class name to toggle (unless null)
 * @param bool - If omitted, cls is toggled in the classList; if true, cls is added; if false, cls is removed
 */
export declare function toggleClass(obj: Node | string | null | undefined, cls: string | null, bool?: boolean): void;
/**
 * Find all elements with this class, and remove from each.
 * @param cls A class name
 */
export declare function removeClassGlobally(cls: string): void;
/**
 * Check if an HTML element is tagged with a given CSS class
 * @param obj - A page element, or id of an element
 * @param cls - A class name to test
 * @returns true iff the class is in the classList
 */
export declare function hasClass(obj: Node | string | null, cls: string | undefined): boolean;
/**
 * Apply all classes in a list of classes.
 * @param obj - A page element, or id of an element
 * @param classes - A list of class names, delimited by spaces
 */
export declare function applyAllClasses(obj: Node | string, classes: string): void;
/**
 * Convert the classList to a simple array of strings
 * @param obj A page element, or id of an element
 * @returns a string[]
 */
export declare function getAllClasses(obj: Node | string): string[];
/**
 * Apply all classes in a list of classes.
 * @param obj - A page element, or id of an element
 * @param classes - A list of class names, delimited by spaces
 */
export declare function clearAllClasses(obj: Node | string, classes?: string | string[]): void;
/**
 * Given one element, find the next one in the document that matches the desired class
 * @param current - An existing element
 * @param matchClass - A class that this element has
 * @param skipClass - [optional] A class of siblings to be skipped
 * @param dir - 1 (default) finds the next sibling, else -1 finds the previous
 * @returns A sibling element, or null if none is found
 */
export declare function findNextOfClass(current: Element, matchClass: string, skipClass?: string, dir?: number): Element | null;
/**
 * Find the index of the current element among the siblings under its parent
 * @param current - An existing element
 * @param parentObj - A parent element (or the class of a parent)
 * @param sibClass - A class name shared by current and siblings
 * @returns - The index, or -1 if current is not found in the specified parent
 */
export declare function indexInContainer(current: Element, parentObj: Element | string, sibClass: string): number;
/**
 * Get the index'ed child element within this parent
 * @param parent - An existing element
 * @param childClass - A class of children under parent
 * @param index - The index of the desired child. A negative value counts back from the end
 * @returns The child element, or null if no children
 */
export declare function childAtIndex(parent: Element, childClass: string, index: number): Element | null;
/**
 * Given an input in one container, find an input in the next container
* @param current - the reference element
* @param matchClass - the class we're looking for
* @param skipClass - a class we're avoiding
* @param containerClass - the parent level to go up to, before coming back down
* @param dir - 1 (default) to go forward, -1 to go back
*/
export declare function findInNextContainer(current: Element, matchClass: string, skipClass: string | undefined, containerClass: string, dir?: number): Element | null;
/**
 * Find either the first or last sibling element under a parent
* @param current - the reference element
* @param matchClass - the class we're looking for
* @param skipClass - a class we're avoiding
* @param containerClass - the parent level to go up to, before coming back down
* @param dir - 1 (default) to go forward, -1 to go back
* @returns The first or last sibling element, or null if no matches
 */
export declare function findEndInContainer(current: Element, matchClass: string, skipClass: string | undefined, containerClass: string, dir?: number): Element | null;
/**
 * Check whether a node, i.e. from elem.parentNode, is an element.
 * @param node Any node, or null|undefined (which would both return false)
 * @returns true for elements
 */
export declare function isElement(node: Node | null | undefined): boolean;
/**
 * Check whether a node, i.e. from elem.parentNode, is an HTML element.
 * @param node Any node, or null|undefined (which would both return false)
 * @returns true for HTML elements
 */
export declare function isHTMLElement(node: Node | null | undefined): boolean;
/**
 * Determine the tag type, based on the tag name (case-insenstive)
 * @param elmt An HTML element
 * @param tag a tag name, or array of names
 */
export declare function isTag(elmt: Element | null, tag: string | string[]): boolean;
/**
 * Find the nearest containing node that contains the desired class.
 * @param elmt - An existing element
 * @param parentClass - A class name of a parent element
 * @returns The nearest matching parent element, up to but not including the body
 */
export declare function findParentOfClass(elmt: Element, parentClass: string): Element | null;
/**
 * Is the element anywhere underneath parent (including itself)
 * @param elmt An element
 * @param parent An element
 * @returns true if parent is anywhere in elmt's parent chain
 */
export declare function isSelfOrParent(elmt: Element, parent: Element): boolean | null;
/**
 * Find the nearest containing node of the specified tag type.
 * @param elmt - An existing element
 * @param parentTag - A tag name of a parent element
 * @returns The nearest matching parent element, up to and including the body
 */
export declare function findParentOfTag(elmt: Element, parentTag: string): Element | null;
/**
 * Find the first child/descendent of the current element which matches a desired class
 * @param elmt - A parent element
 * @param childClass - A class name of the desired child
 * @param skipClass - [optional] A class name to avoid
 * @param dir - If positive (default), search forward; else search backward
 * @returns A child element, if a match is found, else null
 */
export declare function findFirstChildOfClass(elmt: Element, childClass: string, skipClass?: string | undefined, dir?: number): Element | null;
/**
 * Find the first child/descendent of the current element which matches a desired class
 * @param parent - A parent element
 * @param childClass - A class name of the desired child
 * @param index - Which child to find. If negative, count from the end
 * @returns A child element, if a match is found, else null
 */
export declare function findNthChildOfClass(parent: Element, childClass: string, index: number): Element | null;
/**
 * Get the index of an element among its siblings.
 * @param parent A parent/ancestor of the child
 * @param child Any element of type childClass
 * @param childClass A class that defines the group of siblings
 * @returns The index, or -1 if there's an error (the child is not in fact inside the specified parent)
 */
export declare function siblingIndexOfClass(parent: Element, child: Element, childClass: string): number;
/**
 * Look for any attribute in the current tag, and all parents (up to, but not including, body)
 * @param elmt - A page element
 * @param attrName - An attribute name
 * @param defaultStyle - (optional) The default value, if no tag is found with the attribute. Null if omitted.
 * @param prefix - (optional) - A prefix to apply to the answer
 * @returns The found or default style, optional with prefix added
 */
export declare function getOptionalStyle(elmt: Element | null, attrName: string, defaultStyle?: string, prefix?: string): string | null;
/**
 * Look for any attribute in the current tag, and all parents (up to, but not including, body)
 * @param elmt - A page element
 * @param attrName - An attribute name
 * @returns The found data, parsed as a complext attribute
 */
export declare function getOptionalComplex(elmt: Element | null, attrName: string): any;
/**
 * Loop through all elements in a DOM sub-tree, looking for any elements with an optional tag.
 * Recurse as needed. But once found, don't recurse within the find.
 * @param root The node to look through. Can also be 'document'
 * @param attr The name of an attribute. It must be present and non-empty to count
 * @returns A list of zero or more elements
 */
export declare function getAllElementsWithAttribute(root: Node, attr: string): HTMLElement[];
/**
 * Move focus to the given field (if not null), and select the entire contents.
 * If field is of type number, do nothing.
 * @param field - A form field element
 * @param caret - The character index where the caret should go
 * @returns true if the field element and caret position are valid, else false
 */
export declare function moveFocus(field: HTMLElement, caret?: number): boolean;
/**
 * Sort a collection of elements into an array
 * @param src A collection of elements, as from document.getElementsByClassName
 * @param sort_attr The name of the optional attribute, by which we'll sort. Attribute values must be numbers.
 * @returns An array of the same elements, either sorted, or else in original document order
 */
export declare function SortElements(src: HTMLCollectionOf<Element>, sort_attr?: string): Element[];
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
export declare function getElementsByClassOrId(cls: string, id?: string, parent?: Element): Element[];
export type TextInputElement = HTMLInputElement | HTMLTextAreaElement;
export type ArrowKeyElement = TextInputElement | HTMLSelectElement | HTMLButtonElement;
export declare function isTextInputElement(elmt: Element | undefined | null): boolean;
export declare function isArrowKeyElement(elmt: Element | undefined | null): boolean;
/**
 * Retrieve the local transform from an element.
 * This ignores any chain of additional transforms above the element.
 * @param element Any element.
 * @returns A matrix. Will be the identity if no transform applied.
 */
export declare function matrixFromElement(element: Element): DOMMatrix;
/**
 * Find the nearest common ancestor of two elements.
 * This could be a or b, if one is inside the other, or else any element up to the body.
 * @param a Any Element in the document
 * @param b Any Element in the document
 * @returns Another Element
 */
export declare function mutualAncestor(a: Element, b: Element): Element | null;
/**
 * Determine the order of this element within its siblings
 * @param elem Any element
 * @returns 0 to element.parentNode.childNodes.length - 1
 */
export declare function getChildOrder(elem: Element): number;
/**
 * Moves an element within its siblings, to a new index
 * @param elem The element to move
 * @param index The desired index, or -1 for last
 */
export declare function moveChildOrder(elem: Element, index: number): void;
