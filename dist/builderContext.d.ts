import { TrimMode } from "./builder";
import { SourceOffset, SourceOffsetable } from "./contextError";
/**
 * The root context for all builder functions
 * @returns the lookup object on the boiler.
 */
export declare function theBoilerContext(): Record<string, any>;
/**
 * Get the current builder context.
 * If needed, initialized from boilerplate.lookup
 * @returns The top context on the stack.
 */
export declare function getBuilderContext(): Record<string, any>;
/**
 * Inject a builder context for testing purposes.
 * @param lookup Any object, or undefined to remove.
 */
export declare function testBuilderContext(lookup?: Record<string, any>): void;
/**
 * Start a new top level builder context.
 * @param newContext If specified, this is the new context. If not, start from a clone of the current top context.
 * @returns The new context, which the caller may want to modify.
 */
export declare function pushBuilderContext(newContext?: Record<string, any>): Record<string, any>;
/**
 * Pop the builder context stack.
 * @returns The new top-level builder context.
 */
export declare function popBuilderContext(): Record<string, any>;
/**
 * Try to look up a key in the current context level.
 * @param key A key name
 * @param maybe If true, and key does not work, return ''. If false/omitted, throw on bad keys.
 * @returns The value from that key, or undefined if not present
 */
export declare function valueFromContext(key: string, maybe?: boolean): any;
/**
 * Look up a value, according to the context path cached in an attribute
 * @param path A context path
 * @param maybe If true, and key does not work, return ''. If false/omitted, throw on bad keys.
 * @returns Any JSON object
 */
export declare function valueFromGlobalContext(path: string, maybe?: boolean): any;
/**
 * Finish cloning an HTML element
 * @param src The element being cloned
 * @param dest The new element, still in need of attributes
 */
export declare function cloneAttributes(src: Element, dest: Element): void;
/**
 * Finish cloning an HTML element
 * @param src The element being cloned
 * @param dest The new element, still in need of attributes
 * @param attributes A list of attributes we're willing to clone
 */
export declare function cloneSomeAttributes(src: Element, dest: Element, attributes: string[]): void;
/**
 * Process a text node which may contain {curly} formatting.
 * @param text A text node
 * @returns A list with 1 or 0 text nodes
 */
export declare function cloneTextNode(text: Text): Node[];
/**
 * Process text which may contain {curly} formatting.
 * @param str Any text, including text inside attributes
 * @param trueText should be true for text from text nodes,
 * and false for text from attributes.
 * @returns Expanded text
 */
export declare function cloneText(str: string | null, trueText: boolean): string;
/**
 * Resolve an attribute, in situations where it can resolve to an object,
 * and not just text. If any portion is text, then the entire will concatenate
 * as text.
 * @param str the raw attribute
 * @param trim whether any whitespace should be trimmed while processing. By default, off.
 * @returns an object, if the entire raw attribute string is a {formula}.
 * Otherwise a string, which may simply be a clone of the original.
 */
export declare function complexAttribute(str: string, trim?: TrimMode): any;
declare enum TokenType {
    unset = 0,
    unaryOp = 1,// sub-types of operator, when we get to that
    binaryOp = 2,
    anyOperator = 3,
    openBracket = 16,
    closeBracket = 32,
    anyBracket = 48,
    anyOperatorOrBracket = 255,
    word = 256,
    number = 512,
    spaces = 1024,
    anyText = 3840,
    node = 4096
}
export type FormulaToken = SourceOffset & {
    text?: string;
    type: TokenType;
    node?: FormulaNode;
};
/**
 * Divide up a string into sibling tokens.
 * Each token may be divisible into sub-tokens, but those are skipped here.
 * If we're not inside a {=formula}, the only tokens are { and }.
 * If we are inside a {=formula}, then operators and other brackets are tokens too.
 * @param str The parent string
 * @param inFormula True if str should be treated as already inside {}
 * @returns A list of token strings. Uninterpretted.
 * (Only exported for unit tests)
 */
export declare function tokenizeFormula(str: string): FormulaToken[];
/**
 * A node of a formula's expression, which can be combined into a binary tree.
 * Each node also has a parent pointer, to support tree restructuring.
 * A single node is one of:
 *   plain text (could be a number)
 *   a unary operation, with an operator and its operand
 *   a binary operation, with an operator and two operands
 * If an operation, the operand(s) are also FormulaNodes.
 * Nodes are decorated with any immediate bracket, which affects text parsing.
 * (Only exported for unit tests)
 */
export declare class FormulaNode {
    value: FormulaToken;
    span: FormulaToken;
    left?: FormulaNode;
    right?: FormulaNode;
    bracket: string;
    parent?: FormulaNode;
    constructor(value: FormulaToken, right?: FormulaNode, left?: FormulaNode, span?: FormulaToken);
    /**
     * Recreate the expression, as text
     * @returns A string equivalent (including any brackets or quotes it was found inside)
     */
    toString(): string;
    /**
     * Is this node plain-text?
     * @returns false if there is an operation and operands, else false
     */
    isSimple(): boolean;
    reRootContext(): boolean;
    /**
     * Evaluate this node.
     * @param evalText if true, any simple text nodes are assumed to be named objects or numbers
     * else any simple text is just that. No effect for non-simple text.
     * @returns If it's a simple value, return it (any type).
     * If there's an operator and operands, return a type appropriate for that operator.
     */
    evaluate(evalText?: boolean): any;
}
/**
 * 2nd pass of formula parser.
 * Uses operator precedence.
 * Finds the left-most of the highest-precedence operators.
 * Builds a node that binds that operator to its operand(s).
 * Replace that subset with the node, and repeat
 * @param tokens A sequence of tokens
 * @param bracket An encapsulating bracket, if any
 * @returns A single node
 * @throws an error if the formula is malformed: mismatched brackets or incomplete operators
 */
export declare function treeifyFormula(tokens: FormulaToken[], bracket?: FormulaToken): FormulaNode;
/**
 * Evaluate a formula
 * @param str A single formula. The bracketing {} are assumed.
 * @returns A single object, list, or string
 */
export declare function evaluateFormula(str: string | null): any;
/**
 * Evaluate a single attribute of an HTML element
 * @param elmt The HTML element
 * @param attr The name of the attribute
 * @param implicitFormula Whether the contents of the attribute require {} to indicate a formula
 * @param required Whether the attribute is required, in which case it will throw if not present.
 * Otherwise it would return undefined
 * @param onerr What to return in the special case of an exception. If omitted, exceptions throw.
 * @returns Any data type, or undefined if attr isn't present at all
 */
export declare function evaluateAttribute(elmt: Element, attr: string, implicitFormula: boolean, required?: boolean, onerr?: any): any;
/**
 * Convert any type to a number, or throw in broken cases.
 * @param a Any data, but hopefully an int or float
 * @param tok The source offset, if caller knows it
 * @returns The float equivalent
 */
export declare function makeFloat(a: any, tok?: SourceOffsetable): number;
/**
 * Convert any type to an integer, or throw in broken cases.
 * @param a Any data, but hopefully an int
 * @param tok The source offset, if caller knows it
 * @returns The int equivalent
 */
export declare function makeInt(a: any, tok?: SourceOffsetable): number;
/**
 * Convert any type to string, or throw in broken cases.
 * @param a Any data, but hopefully string-friendly
 * @param tok The source offset, if caller knows it
 * @returns The string equivalent
 */
export declare function makeString(a: any, tok?: SourceOffsetable): string;
/**
 * Each token in a text string is either plain text or a formula that should be processed.
 */
type TextToken = SourceOffset & {
    text: string;
    formula: boolean;
};
/**
 * Parse text that occurs inside a built control element into tokens.
 * @param raw the raw document text
 * @param implicitFormula if true, the full text can be a formula without being inside {}.
 * (Only exported for unit tests)
 */
export declare function tokenizeText(raw: string, implicitFormula?: boolean): TextToken[];
/**
 * Test a key in the current context
 * @param key A key, initially from {curly} notation
 * @returns true if key is a valid path within the context
 */
export declare function keyExistsInContext(key: string): boolean;
/**
 * Enable lookups into the context by key name.
 * Keys can be paths, separated by dots (.)
 * Paths can have other paths as nested arguments, using [ ]
 * Note, the dot separator is still required.
 *   example: foo.[bar].fuz       equivalent to foo[{bar}].fuz
 *   example: foo.[bar.baz].fuz   equivalent to foo[{bar.baz}].fuz
 * Even arrays use dot notation: foo.0 is the 0th item in foo
 * @param key A key, initially from {curly} notation
 * @returns Resolved text
 */
export declare function textFromContext(key: string | null): string;
export {};
