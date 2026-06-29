/**
 * There is a Decoders link in the bottom corner of the page.
 * Set it up such that clicking rotates through the 3 visibility states.
 * @param margins the parent node of the toggle UI
 * @param mode the default decoder mode, if specified
 */
export declare function setupDecoderToggle(margins: HTMLDivElement | null, mode?: boolean | string): void;
/**
 * Alternate between showing and hiding the decoder iframe
 */
export declare function toggleDecoder(evt: PointerEvent): void;
/**
 * Explicitly show or hide the decoder iframe
 */
export declare function showDecoder(show: boolean): void;
