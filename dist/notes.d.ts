/**
 * Look for elements tagged with any of the implemented "notes" classes.
 * Each of these will end up with a notes input area, near the owning element.
 * Note fields are for players to jot down their thoughts, before comitting to an answer.
 */
export declare function setupNotes(margins: HTMLDivElement): void;
/**
 * Rotate to the next note visibility state.
 */
export declare function toggleNotes(): void;
/**
 * Elements tagged with class = 'cross-off' are for puzzles clues that don't indicate where to use it.
 * Any such elements are clickable. When clicked, a check mark is toggled on and off, allowed players to mark some clues as done.
 */
export declare function setupCrossOffs(): void;
export declare function setupHighlights(): void;
/**
 * If an element can be highlighted, toggle that highlight on or off
 * @param elmt The element to highlight
 */
export declare function toggleHighlight(elmt?: HTMLElement): void;
