/**
 * Find a template that matches an ID.
 * Could be on the local page, or a built-in one
 * @param tempId The ID of the template (must be valid)
 * @returns An HTMLTemplateElement, or throws
 */
export declare function getTemplate(tempId: string): HTMLTemplateElement;
/**
 * Match a template name to a built-in template object
 * @param tempId The ID
 * @returns A template element (not part of the document), or undefined if unrecognized.
 */
export declare function builtInTemplate(tempId: string): HTMLTemplateElement | undefined;
/**
 * Method to pair with finalAnswer and extractedCopiable* templates
 * @param id ID of extracted, default 'extracted'
 */
export declare function copyto_final_answer(id?: string): void;
