type Rect2D = {
    left: number;
    right: number;
    top: number;
    bottom: number;
};
/**
 * A summary of a single DOM node's position and contents
 */
export type LayoutSummary = {
    index: number;
    id?: string;
    nodeType: number;
    bounds?: Rect2D;
    descendents: number;
    text?: string;
    tagName?: string;
    children?: LayoutSummary[];
};
/**
 * Summarize the full layout of a typical puzzle page.
 * If a pageBody elememt exists, use that as the root.
 * Otherwise, use the <body> tag, or as a last resort, the DOM root node.
 * @returns A tree of LayoutSummary nodes
 */
export declare function summarizePageLayout(): LayoutSummary;
/**
 * Bit flags for how two layout summaries might differ
 */
declare enum LayoutDiffType {
    None = 0,
    Add = 1,
    Remove = 2,
    Change = 3,
    AddChild = 4,
    RemoveChild = 8,
    ChangeText = 16,
    ChangeRect = 32
}
/**
 * A single different point within a larger document comparison
 */
type LayoutDiff = {
    diffType: LayoutDiffType;
    before?: LayoutSummary;
    after?: LayoutSummary;
};
/**
 * Build a list of diffs for a before- and after- layout tree
 * @param bef The before layout
 * @param aft The after layout
 * @returns A flat list of difference nodes, including differences among child nodes.
 */
export declare function diffSummarys(bef: LayoutSummary, aft: LayoutSummary): LayoutDiff[];
export declare function renderDiffs(diffs: LayoutDiff[]): void;
export {};
