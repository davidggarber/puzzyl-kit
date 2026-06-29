/***********************************************************
 * TABLEBUILDER.TS
 * Utilities for building pages with 2D tables
 *  - Constructs cells on the fly
 *  - Can use actual tables, or SVG
 * Should be called before other initializers,
 * so the generated contents can trigger other behaviors.
 */
export type TableDetails = {
    rootId: string;
    height?: number;
    width?: number;
    data?: string[];
    onRoot?: (root: HTMLElement | null) => undefined;
    onRow?: (y: number) => HTMLElement | null;
    onCell: (val: string, x: number, y: number) => HTMLElement | null;
};
/**
 * Create a generic TR tag for each row in a table.
 * Available for TableDetails.onRow where that is all that's needed
 */
export declare function newTR(y: number): HTMLTableRowElement;
/**
 * Create a table from details
 * @param details A TableDetails, which can exist in several permutations with optional fields
 */
export declare function constructTable(details: TableDetails): void;
export declare const svg_xmlns = "http://www.w3.org/2000/svg";
export declare function constructSvgTextCell(val: string, dx: number, dy: number, cls: string, stampable?: boolean): SVGGElement | null;
export declare function constructSvgImageCell(img: string, dx: number, dy: number, id?: string, cls?: string): SVGGElement;
export declare function constructSvgStampable(): SVGForeignObjectElement;
