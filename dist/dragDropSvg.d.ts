/**
 * Attach click handlers to the root, and any moveable elements.
 * @root: the ID or class of the root SVG element
 */
export declare function preprocessSvgDragFunctions(svgId: string): void;
/**
 * Calculate the relative transform matrix from the container down to the child.
 * @param child Any element inside container
 * @param container Any element
 * @returns A transform matrix, from the containers frame of reference, to the child's
 */
export declare function getAccumulatedTransformMatrix(child: Element, container: Element): DOMMatrix;
