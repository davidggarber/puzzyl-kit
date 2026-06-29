/**
 * Does this document contain any builder elements?
 * @param doc An HTML document
 * @returns true if any of our custom tags are present.
 * NOTE: Does not detect {curlies} in plain text or plain elements.
 */
export declare function hasBuilderElements(doc: Document): boolean;
export declare function initElementStack(elmt: Element | null): void;
export declare function pushBuilderElement(elmt: Element): void;
export declare function popBuilderElement(): void;
export declare enum TrimMode {
    off = 0,// no trimming (default)
    on = 1,// trim text regions that are only whitespace
    pre = 2,// trim each line, so that <pre> tags don't need to be artificially outdented
    all = 3
}
/**
 * When in trim mode, cloning text between elements will omit any sections that are pure whitespace.
 * Sections that include both text and whitespace will be kept in entirety.
 * @returns One of three trim states, set anywhere in the current element heirarchy.
 */
export declare function getTrimMode(): TrimMode;
/**
 * Throwing exceptions while building will hide large chunks of page.
 * Instead, set nothrow on any build element (not normal elements) to disable rethrow at that level.
 * In that case, the error will be logged, but then building will continue.
 * FUTURE: set onthrow to the name of a local function, and onthrow will call that, passing the error
 * @returns true if the current element expresses nothrow as either a class or attribute.
 */
export declare function shouldThrow(ex: Error, node1?: Node, node2?: Node, node3?: Node): boolean;
/**
 * See if any parent element in the builder stack matches a lambda
 * @param fn a Lambda which takes an element and returns true for the desired condition
 * @returns the first parent element that satisfies the lambda, or null if none do
 */
export declare function getBuilderParentIf(fn: (e: Element) => boolean): Element | null;
/**
 * See if any parent element, either in the builder stack, or src element tree, matches a lambda
 * @param fn a Lambda which takes an element and returns true for the desired condition
 * @returns the first parent element that satisfies the lambda, or null if none do
 */
export declare function getParentIf(elmt: Element | null, fn: (e: Element) => boolean): Element | null;
/**
 * Is the current stack of building elements currently inside an SVG tag.
 * @returns returns true if inside an SVG, unless further inside an EMBEDDED_OBJECT.
 */
export declare function inSvgNamespace(): boolean;
/**
 * Look for control tags like for loops and if branches.
 * @param rootId: if true, search for known builder elements.
 * If a string (usually pageBody), start with that node.
 */
export declare function expandControlTags(rootId: string | boolean): void;
/**
 * Concatenate one list onto another
 * @param list The list to modified
 * @param add The list to add to the end
 */
export declare function pushRange(list: Node[], add: Node[]): void;
/**
 * Append more than one child node to the end of a parent's child list
 * @param parent The parent node
 * @param add A list of new children
 */
export declare function appendRange(parent: Node, add: Node[]): void;
/**
 * Clone every node inside a parent element.
 * Any occurence of {curly} braces is in fact a lookup.
 * It can be in body text or an element attribute value
 * @param src The containing element
 * @param context A dictionary of all values that can be looked up
 * @returns A list of nodes
 */
export declare function expandContents(src: HTMLElement): Node[];
/**
 * Some HTML elements and attributes are immediately acted upon by the DOM.
 * To delay that until after builds (especially <for> and <if>),
 * use any of three alternate naming schemes:
 *   _prefix or suffix_  Underscores will be removed.
 *   ddupe-letter        If the initial letter is duplicated, drop it.
 * The tag or attribute will be renamed when cloned, and the browser will treat it as a no-op until then.
 * @param name Any tag or attribute name
 * @returns The name, or the the name without the _ underscore or doubled initial letter
 */
export declare function normalizeName(name: string): string;
/**
 * Splitting a text string by character is complicated when emoji are involved.
 * There are multiple ways glyphs can be combined or extended.
 * @param str A plain text string
 * @returns An array of strings that represent individual visible glyphs.
 */
export declare function splitEmoji(str: string): string[];
/**
 * Write a comment to the console.
 * Only applies if in trace mode. Otherwise, a no-op.
 * @param str What to write
 */
export declare function consoleTrace(str: string): void;
export declare function consoleComment(str: string): Node[];
