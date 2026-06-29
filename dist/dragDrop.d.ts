export type Position = {
    x: number;
    y: number;
};
/**
 * Convert an element's left/top style to a position
 * @param elmt Any element with a style
 * @returns A position
 */
export declare function positionFromStyle(elmt: HTMLElement): Position;
/**
 * Scan the page for anything marked moveable, drag-source, or drop-target
 * Those items get click handlers
 */
export declare function preprocessDragFunctions(): void;
/**
 * Similar to pre-process, but a special case when the draggable
 * elements show up after the initial page setup.
 * @param container An element which is or contains 'moveable',
 * and other drag-drop artifacts.
 */
export declare function postprocessDragFunctions(container: HTMLElement): void;
/**
 * Assign z-index values to all moveable objects within a container.
 * Objects' z index is a function of their y-axis, and can extend up or down.
 * @param container The free-drop container, which can contain a data-z-grow attribute
 */
export declare function initFreeDropZorder(container: HTMLElement): void;
/**
 * Move an object to a destination.
 * @param moveable The object to move
 * @param destination The container to place it in
 */
export declare function quickMove(moveable: HTMLElement, destination: HTMLElement): void;
/**
 * Move an object within a free-move container
 * @param moveable The object to move
 * @param position The destination position within the container
 */
export declare function quickFreeMove(moveable: HTMLElement, position: Position): void;
