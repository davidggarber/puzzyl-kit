/**
 * Find the center of an element, in client coordinates
 * @param elmt Any element
 * @returns A position
 */
export declare function positionFromCenter(elmt: HTMLElement): DOMPoint;
/**
 * Find the square of the distance between a point and the mouse
 * @param elmt A position, in screen coordinates
 * @param evt A mouse event
 * @returns The distance, squared
 */
export declare function distance2Mouse(pos: DOMPoint, evt: MouseEvent): number;
export declare function distance2(pos: DOMPoint, pos2: DOMPoint): number;
/**
 * Scan the page for anything marked vertex or straight-edge-area
 * Those items get click handlers
 * @param areaCls the class name of the root SVG for drawing straight edges
 */
export declare function preprocessRulerFunctions(mode: string, fill: boolean): void;
/**
 * Identified which type of selector is enabled for this page
 * @returns either 'straight-edge' or 'word-select'
 */
export declare function getStraightEdgeType(): string;
/**
 * Supported kinds of straight edges.
 */
export declare const EdgeTypes: {
    straightEdge: string;
    wordSelect: string;
    hashiBridge: string;
};
/**
 * Create a straight-edge from a list of vertices
 * Called while restoring from a save, so does not redundantly save progress.
 * @param vertexList A joined list of vertex global-indeces, delimeted by commas
 */
export declare function createFromVertexList(vertexList: string): void;
export declare function clearAllStraightEdges(id: string): void;
