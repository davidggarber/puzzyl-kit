export type SourceOffset = {
    source: string;
    offset?: number;
    length?: number;
};
/**
 * Custom error which identify which parts of the source document are malformed.
 * It can leverage nested try/catch blocks to add additional context.
 */
export declare class ContextError extends Error {
    cause: Error | undefined;
    callStack: string | undefined;
    elementStack: Element[] | undefined;
    functionStack: string[];
    sourceStack: SourceOffset[];
    /**
     * Create a new ContextError (or derived error)
     * @param msg The message of the Error
     * @param source Indicates which source text specifically triggered this error
     * @param inner The inner/causal error, if any
     */
    constructor(msg: string, source?: SourceOffsetable, inner?: unknown);
    _cacheCallstack(): void;
}
/**
 * Type predicate to separate ContextErrors from generic errors.
 * @param err Any error
 * @returns true if it is a ContextError
 */
export declare function isContextError(err: unknown): err is ContextError;
/**
 * Instead of creating a source offset every time, anticipating an exception
 * that rarely gets thrown, instead pass a lambda.
 */
type SourceOffseter = () => SourceOffset;
/**
 * Methods generally take either flavor: SourceOffset or SourceOffseter
 */
export type SourceOffsetable = SourceOffset | SourceOffseter;
/**
 * Add additional information to a context error.
 * @param inner Another exception, which has just been caught.
 * @param func The name of the current function (optional).
 * @param elmt The name of the current element in the source doc (optional)
 * @param src The source offset that was being evaluated
 * @returns If inner is already a ContextError, returns inner, but now augmented.
 * Otherwise creates a new ContextError that wraps inner.
 */
export declare function wrapContextError(inner: unknown, func?: string, src?: SourceOffsetable): ContextError;
export declare function nodeSourceOffset(node: Node): SourceOffset;
/**
 * Recreate the source for a tag. Then pinpoint the offset of a desired attribute.
 * @param elmt An HTML tag
 * @param attr A specific attribute, whose value is being evaluated.
 * @returns A source offset, built on the recreation
 */
export declare function elementSourceOffset(elmt: Element, attr?: string): SourceOffset;
/**
 * Instead of creating a source offset every time, anticipating an exception
 * that rarely gets thrown, instead pass a lambda.
 */
export declare function elementSourceOffseter(elmt: Element, attr?: string): SourceOffseter;
/**
 * A code error has no additional fields.
 * It just acknowledges that the bug is probably the code's fault, and not the raw inputs's.
 */
export declare class CodeError extends Error {
    constructor(msg: string);
}
/**
 * For debug traces, summarize a tag without including its children/contents
 * @param elmt Any HTML element
 * @returns A recreation of its start tag
 */
export declare function debugTagAttrs(elmt: Element, expandFormulas?: boolean): string;
/**
 * For debugging, mirror a builder tag as a comment inside the new tag it generated.
 * Show attributes in their raw version, potentially with formulas,
 * and again with resolved values, if different.
 * @param src The original builder element
 * @param dest The new element that replaces it, or else a list of elements
 * @param expandFormulas If true, try expanding formulas.
 * Don't use if the resolved formulas are at risk of being large (i.e. objects or lists)
 */
export declare function traceTagComment(src: Element, dest: Element | Node[], expandFormulas: boolean): void;
export {};
