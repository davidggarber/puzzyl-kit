import { toggleClass } from "./classUtil";

type Rect2D = {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

function equalRect2D(a:Rect2D, b:Rect2D) {
    return a.left == b.left
        && a.right == b.right
        && a.top == b.top
        && a.bottom == b.bottom;
}

/**
 * Simplify a DOMRect to 4 edge position values, each rounded to the nearest 0.1 
 * @param r a DOMRect
 * @returns An equivalent Rect2D
 */
function createRect2D(r:DOMRect):Rect2D {
    const rect:Rect2D = {
        left: Math.round(r.left * 10) / 10,
        right: Math.round(r.right * 10) / 10,
        top: Math.round(r.top * 10) / 10,
        bottom: Math.round(r.bottom * 10) / 10,
    };
    return rect;
}

/**
 * Create a size-0 rect at the top-left corner of another rect 
 * @param r a Rect2D
 * @returns An new Rect2D
 */
function pointAtCorner(r?:Rect2D):Rect2D {
    const x = r?.left ?? 0;
    const y = r?.right ?? 0;
    const rect:Rect2D = {
        left: x,
        right: x,
        top: y,
        bottom: y,
    };
    return rect;
}

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
 * Build a tree of LayoutSummary nodes
 * @param root The root for this (sub-)tree
 * @param index The index of the root within its parent
 * @returns A LayoutSummary tree, which may be merged into a parent tree
 */
function summarizeLayout(root:Node, index?:number):LayoutSummary {
    if (index === undefined) {
        index = 0;
    }
    const summary:LayoutSummary = {
        index: index,
        nodeType: root.nodeType,
        descendents: root.childNodes.length
    };
    if (root.nodeType == Node.ELEMENT_NODE) {
        const elmt = root as HTMLElement;
        const rect = elmt.getBoundingClientRect();
        summary.bounds = createRect2D(rect);
        if (elmt.id) {
            summary.id = elmt.id;
        }
        // summary.text = elmt.innerText;
        const children = [] as LayoutSummary[];
        for (let i = 0; i < root.childNodes.length;i++) {
            const child = root.childNodes[i] as HTMLElement;
            const cl = summarizeLayout(child, i);
            children.push(cl);
            summary.descendents += cl.descendents;
        }
        summary.children = children;
    }
    else if (root.nodeType != Node.COMMENT_NODE && root.textContent) {
        summary.text = root.textContent;

        var range = document.createRange();
        range.selectNode(root);
        const rect = range.getBoundingClientRect();
        range.detach(); // frees up memory in older browsers
        summary.bounds = createRect2D(rect);
    }

    return summary;
}

function pageLayoutRootNode(): Node {
    const pageBody = document.getElementById('pageBody');
    if (pageBody) {
        return pageBody;
    }
    const bodies = document.getElementsByTagName('body');
    if (bodies && bodies.length > 0) {
        return bodies[0];
    }
    return document.getRootNode();

}

/**
 * Summarize the full layout of a typical puzzle page.
 * If a pageBody elememt exists, use that as the root.
 * Otherwise, use the <body> tag, or as a last resort, the DOM root node.
 * @returns A tree of LayoutSummary nodes
 */
export function summarizePageLayout():LayoutSummary {
    const pageRoot = pageLayoutRootNode();
    return summarizeLayout(pageRoot);
}

/**
 * Bit flags for how two layout summaries might differ
 */
enum LayoutDiffType {
    None = 0,
    Add = 1,
    Remove = 2,
    Change = 3,
    AddChild = 4,
    RemoveChild = 8,
    ChangeText = 16,
    ChangeRect = 32,
};

/**
 * A single different point within a larger document comparison 
 */
type LayoutDiff = {
    diffType: LayoutDiffType;
    before?: LayoutSummary;
    after?: LayoutSummary;
};

/**
 * Are these two elements sufficiently similar so as to be comparable?
 * Same node type and element tag name. If they have IDs, they must match too.
 * @param a A layout.
 * @param b Another layout.
 * @returns true if these two objects should be compared at greater depth
 */
function canCompareLayouts(a:LayoutSummary, b:LayoutSummary): boolean {
    return a.nodeType == b.nodeType
        && a.tagName == b.tagName
        && a.id == b.id;
}

/**
 * Find the next element in the list which could plausibly be compared with a given element.
 * @param s The element seeking a partner to compare
 * @param list A list of potential partner elements
 * @param first The first index in the list to consider
 * @returns -1 if none found, else the index (>= first) of the match.
 */
function findComparableLayout(s: LayoutSummary, list: LayoutSummary[], first: number): number {
    for (; first < list.length; first++) {
        if (canCompareLayouts(s, list[first])) {
            return first;
        }
    }
    return -1;
}

/**
 * Build a list of diffs for a before- and after- layout tree
 * @param bef The before layout
 * @param aft The after layout
 * @returns A flat list of difference nodes, including differences among child nodes.
 */
export function diffSummarys(bef:LayoutSummary, aft:LayoutSummary):LayoutDiff[] {
    const diffs = [] as LayoutDiff[];
    let ldt:LayoutDiffType = LayoutDiffType.None;
    if (bef.text != aft.text) {
        ldt |= LayoutDiffType.ChangeText;
    }
    if (bef.bounds || aft.bounds) {
        if (!bef.bounds || !aft.bounds || !equalRect2D(bef.bounds, aft.bounds)) {
            ldt |= LayoutDiffType.ChangeRect;
        }
    }
    if (bef.children && aft.children) {
        let b = 0;
        let a = 0;
        while (b < bef.children.length || a < aft.children.length) {
            const bb = a >= aft.children.length ? bef.children.length : 
                findComparableLayout(aft.children[a], bef.children, b);
            if (bb < 0) {
                ldt |= LayoutDiffType.AddChild;
                const added:LayoutDiff = {
                    diffType: LayoutDiffType.Add,
                    after: aft.children[a]
                };
                diffs.push(added);
                a++;
            }
            else {
                for (; b < bb; b++) {
                    ldt |= LayoutDiffType.RemoveChild;
                    const removed:LayoutDiff = {
                        diffType: LayoutDiffType.Remove,
                        before: bef.children[b]
                    };
                    diffs.push(removed);    
                }

                if (a < aft.children.length) {
                    const ds = diffSummarys(bef.children[b], aft.children[a]);
                    for (let i = 0; i < ds.length; i++) {
                        diffs.push(ds[i]);
                    }
                    b++;
                    a++;
                }
            }
        }
    }
    else if (bef.children) {
        ldt |= LayoutDiffType.RemoveChild;
    }
    else if (aft.children) {
        ldt |= LayoutDiffType.AddChild;
        // for (let i = 0; i < aft.children.length; i++) {

        // }
    }

    if (ldt != LayoutDiffType.None) {
        const change:LayoutDiff = {
            diffType: ldt,
            before: bef,
            after: aft
        };
        diffs.push(change);  // TODO: insert at 0
    }

    return diffs;
}

export function renderDiffs(diffs:LayoutDiff[]) {
    let diffRoot = document.getElementById('render-diffs');
    if (!diffRoot) {
        diffRoot = document.createElement('div');
        diffRoot.id = 'render-diffs';
        const body = document.getElementsByTagName('body')[0];
        body.appendChild(diffRoot);
    }

    // toggleClass(diffRoot, 'diff-div', true);
    for (let i = 0; i < diffs.length; i++) {
        const diff = diffs[i];
        renderDiff(diffRoot, diff);
    }
}

function renderDiff(diffRoot:HTMLElement, diff:LayoutDiff) {
    if (!diff?.after?.bounds && !diff?.before?.bounds) {
        return;  // Nowhere to show
    }

    const div = document.createElement('div');
    toggleClass(div, 'diff-div', true);
    toggleClass(div, 'diff-add', (diff.diffType & LayoutDiffType.Add) != 0);
    toggleClass(div, 'diff-rem', (diff.diffType & LayoutDiffType.Remove) != 0);
    toggleClass(div, 'diff-text', (diff.diffType & LayoutDiffType.ChangeText) != 0);
    toggleClass(div, 'diff-rect', (diff.diffType & LayoutDiffType.ChangeRect) != 0);

    const before = diff.before?.bounds ?? pointAtCorner(diff.after?.bounds);
    const after = diff.after?.bounds ?? pointAtCorner(diff.before?.bounds);

    div.style.left = after.left + 'px';
    div.style.top = after.top + 'px';
    div.style.width = (after.right - after.left) + 'px';
    div.style.height = (after.bottom - after.top) + 'px';


    if (before.left != after.left) {
        div.appendChild(createDiffDeltaRect(before.left - after.left, 'left'));
    }
    if (before.top != after.top) {
        div.appendChild(createDiffDeltaRect(before.top - after.top, 'top'));
    }
    if (before.right != after.right) {
        div.appendChild(createDiffDeltaRect(before.right - after.right, 'right'));
    }
    if (before.bottom != after.bottom) {
        div.appendChild(createDiffDeltaRect(before.bottom - after.bottom, 'bottom'));
    }

    diffRoot.appendChild(div);
}

function createDiffDeltaRect(size:number, edge:string):HTMLDivElement {
    const d = document.createElement('div');
    toggleClass(d, 'diff-shrink', size<0);
    toggleClass(d, 'diff-grow', size>0);
    if (edge == 'left') {
        d.style.left = ((size < 0) ? size : 0) + 'px';
        d.style.width = Math.abs(size) + 'px';
        d.style.top = '0px';
        d.style.height = '100%';
    }
    else if (edge == 'top') {
        d.style.top = ((size < 0) ? size : 0) + 'px';
        d.style.height = Math.abs(size) + 'px';
        d.style.left = '0px';
        d.style.width = '100%';
    }
    else if (edge == 'right') {
        d.style.right = ((size > 0) ? size : 0) + 'px';
        d.style.width = Math.abs(size) + 'px';
        d.style.top = '0px';
        d.style.height = '100%';
    }
    else if (edge == 'bottom') {
        d.style.bottom = ((size > 0) ? size : 0) + 'px';
        d.style.height = Math.abs(size) + 'px';
        d.style.left = '0px';
        d.style.width = '100%';
    }
    return d;
}