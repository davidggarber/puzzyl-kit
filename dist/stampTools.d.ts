/**
 * Type structure of a stamp tool, as provided to a classStampPalette template
 */
export type StampToolDetails = {
    id: string;
    modifier?: string;
    label?: string;
    img?: string;
    next?: string;
    data?: string;
};
/**
 * Map a stampable area to a palette of stamps.
 */
type stampSet = {
    name: string;
    container: HTMLElement | null;
    palette: HTMLElement | null;
    stampTools: HTMLElement[];
    selectedTool: HTMLElement | null;
    firstTool: HTMLElement | null;
    eraseTool: HTMLElement | null;
    extractorTool: HTMLElement | null;
    extractedId?: string;
    canDrag: boolean;
    prevStampablePointer: HTMLElement | null;
    dragDrawTool: HTMLElement | null;
    lastDrawTool: HTMLElement | null;
    usesMods: boolean;
};
/**
 * Scan the page for anything marked stampable or a draw tool
 */
export declare function preprocessStampObjects(): void;
/**
 * Expose current stamp tool, in case other features want to react
 * @package stampSet The set we're part of
 * @returns The ID of a stamp tool, or '' if none selected
 */
export declare function getCurrentStampToolId(stampSet: stampSet): string;
/**
 * A stampable element can be the eventual container of the stamp. (example: TD)
 * Or it can assign another element to be the stamp container, with the data-stamp-parent attribute.
 * If present, that field specifies the ID of an element.
 * @param target An element with class="stampable"
 * @returns
 */
export declare function getStampParent(target: HTMLElement): HTMLElement;
/**
 * Draw on the target surface, using the named tool.
 * @param target The surface on which to draw
 * @param tool The stampTool object that defines a tool
 * A stampTool can then define behavior in several ways...
 *  - data-template-id       id of a template to instantiate
 *  - data-use-template-id   id of a builder template to use, passing arguments
 *  - data-style             apply the named style(s) to the destination
 *  - data-unstyle           remove the named style(s) from the destination
 *  - data-erase             simply delete the existing contents
 * A stampTool can also define the next element in a rotation
 *  - data-next-id           id of another stampTool
 *                           otherwise it will rotate through stampTools in visual order
 */
export declare function doStamp(stampSet: stampSet | undefined, target: HTMLElement, tool: HTMLElement): void;
export {};
