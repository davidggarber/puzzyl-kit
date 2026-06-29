/**
 * Replace a <use> tag with the contents of a <template>.
 * Along the way, push any attributes of the <use> tag onto the context.
 * Also push the context paths (as strings) as separate attributes.
 * Afterwards, pop them all back off.
 * Optionally, a <use> tag without a template="" attribute is a way to modify the context for the use's children.
 * @param node a <use> tag, whose attributes are cloned as arguments
 * @param tempId The ID of a template to invoke. If not set, the ID should be in node.template
 * @returns An array of nodes to insert into the document in place of the <use> tag
 */
export declare function useTemplate(node: HTMLElement, tempId?: string | null): Node[];
/**
 * Replace the current contents of a parent element with
 * the contents of a template.
 * @param parent Parent element to refill. Existing contents will be cleared.
 * @param tempId ID of a <template> element
 * @param arg an object whose keys and values will become the arguments to the template.
 * @returns The first injected element
 */
export declare function refillFromTemplate(parent: Element, tempId: string, args?: Record<string, any>): Node | undefined;
/**
 * Appen the contents of a template after any existing children of a parent
 * @param parent Parent element to append to.
 * @param tempId ID of a <template> element
 * @param arg an object whose keys and values will become the arguments to the template.
 * @returns The first injected element
 */
export declare function appendFromTemplate(parent: Element, tempId: string, args?: Record<string, any>): Node | undefined;
