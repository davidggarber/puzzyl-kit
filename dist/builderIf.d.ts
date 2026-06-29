export type ifResult = {
    passed: boolean;
    index: number;
};
/**
 * Potentially several kinds of if expressions:
 *   equality: <if test="var" eq="value">
 *   not-equality: <if test="var" ne="value">
 *   less-than: <if test="var" lt="value">
 *   less-or-equal: <if test="var" le="value">
 *   greater-than: <if test="var" gt="value">
 *   greater-or-equal: <if test="var" ge="value">
 *   contains: <if test="var" in="value">
 *   not-contains: <if test="var" ni="value">
 *   boolean: <if test="var">
 * @param src the <if>, <elseif>, or <else> element
 * @param result in/out parameter that determines whether any sibling in a sequence of if/else-if/else tags has passed yet
 * @returns a list of nodes, which will replace this <if> element
 */
export declare function startIfBlock(src: HTMLElement, result: ifResult): Node[];
