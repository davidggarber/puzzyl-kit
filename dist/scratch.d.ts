/**
 * Setup a scratch pad that is the same size as the page.
 */
export declare function setupScratch(): void;
/**
 * Convert the <div> HTML contents to text appropriate for a textarea or storage
 * @param div A flattened scratch note
 * @returns A string of lines of notes with \n line breaks
 */
export declare function textFromScratchDiv(div: HTMLDivElement): string;
/**
 * Wipe away all scratches
 */
export declare function scratchClear(): void;
/**
 * Create a scratch div
 * @param x The client-x of the div
 * @param y The client-y of the div
 * @param width The (max) width of the div
 * @param height The (max) height of the div
 * @param text The text contents, as they would come from a textarea, with \n
 */
export declare function scratchCreate(x: number, y: number, width: number, height: number, text: string): void;
