import { GuessLog } from "./confirmation";
import { LoginInfo } from "./eventSync";
/**
 * Saved state uses local storage, keyed off this page's URL
 * minus any parameters
 */
export declare function storageKey(): string;
/**
 * If storage exists from a previous visit to this puzzle, offer to reload.
 */
export declare function checkLocalStorage(): void;
/**
 * Strings we parse as JSON could come from anywhere.
 * JSON.parse will throw if the JSON is not well-formed.
 * Instead, return null.
 * @param str A string we expect to be JSON
 * @returns An object, or null
 */
export declare function TryParseJson(str: string, errorIfNot?: boolean): any;
/**
 * Update the saved letters object
 * @param element an letter-input element
 */
export declare function saveLetterLocally(input: HTMLInputElement): void;
/**
 * Update the saved words object
 * @param element an word-input element
 */
export declare function saveWordLocally(input: HTMLInputElement): void;
/**
 * Update the saved notes object
 * @param element an note-input element
 */
export declare function saveNoteLocally(input: HTMLInputElement): void;
/**
 * Update the saved checkmark object
 * @param element an element which might contain a checkmark
 */
export declare function saveCheckLocally(element: HTMLElement, value: boolean): void;
/**
 * Update the saved containers objects
 * @param element an element which can move between containers
 */
export declare function saveContainerLocally(element: HTMLElement, container: HTMLElement): void;
/**
 * Update the saved positions object
 * @param element a moveable element which can free-move in its container
 */
export declare function savePositionLocally(element: HTMLElement): void;
/**
 * Update the saved drawings object
 * @param element an element which might contain a drawn object
 */
export declare function saveStampingLocally(element: HTMLElement): void;
/**
 * Update the saved highlights object
 * @param element a highlightable object
 */
export declare function saveHighlightLocally(element: HTMLElement): void;
/**
 * Update the local cache with this vertex list.
 * @param vertexList A list of vertex global indeces
 * @param add If true, this edge is added to the saved state. If false, it is removed.
 */
export declare function saveStraightEdge(vertexList: string, add: boolean): void;
/**
 * Update the local cache with the full set of guesses for this puzzle
 * @param guesses An array of guesses, in time order
 */
export declare function saveGuessHistory(guesses: GuessLog[]): void;
/**
 * Update the local cache with the latest notes, and where they're placed.
 * NOTE: only call this once any active note has been flattened.
 * @param scratchPad The parent div of all notes
 */
export declare function saveScratches(scratchPad: HTMLDivElement): void;
/**
 * Save one attribute from any element that is tagged with the class 'save-state'
 * The attribute to save is named in the optional attribute 'data-save-state'.
 * If omitted, the default is the value of an form field.
 */
export declare function saveStates(): void;
/**
 * At page initialization, every element that can be cached gets an index attached to it.
 * Possibly more than one, if it can cache multiple traits.
 * Now retrieve that index.
 * @param elmt The element with the index
 * @param suffix The name of the index (optional)
 * @returns The index, or -1 if invalid
 */
export declare function getGlobalIndex(elmt: HTMLElement, suffix?: string): number;
/**
 * At page initialization, every element that can be cached gets an index attached to it.
 * Possibly more than one, if it can cache multiple traits.
 * Find the element with the desired global index.
 * @param cls A class, to narrow down the set of possible elements
 * @param index The index
 * @param suffix The name of the index (optional)
 * @returns The element
 */
export declare function findGlobalIndex(cls: string, index: number, suffix?: string): HTMLElement | null;
/**
 * Create a dictionary, mapping global indeces to the corresponding elements
 * @param cls the class tag on all applicable elements
 * @param suffix the optional suffix of the global indeces
 */
export declare function mapGlobalIndeces(cls: string, suffix?: string): {
    [key: number]: HTMLElement;
};
/**
 * Assign globalIndeces to every letter- or word- input field
 */
export declare function indexAllInputFields(): void;
/**
 * Assign globalIndeces to every note field
 */
export declare function indexAllNoteFields(): void;
/**
 * Assign globalIndeces to every check mark
 */
export declare function indexAllCheckFields(): void;
/**
 * Assign globalIndeces to every moveable element and drop target
 */
export declare function indexAllDragDropFields(): void;
/**
 * Assign globalIndeces to every stampable element
 */
export declare function indexAllDrawableFields(): void;
/**
 * Assign globalIndeces to every highlightable element
 */
export declare function indexAllHighlightableFields(): void;
/**
 * Assign globalIndeces to every vertex
 */
export declare function indexAllVertices(): void;
/**
 * A limited list of meaningful puzzle statuses
 */
export declare const PuzzleStatus: {
    Hidden: string;
    Locked: string;
    Unlocked: string;
    Loaded: string;
    Solved: string;
};
/**
 * Update the master list of puzzles for this event
 * @param puzzle The name of this puzzle (not the filename)
 * @param status One of the statuses in PuzzleStatus
 * @param puzzleList The relative path to the puzzle_list to update (omit if local)
 * @returns true if the new status is different than the old
 */
export declare function updatePuzzleList(puzzle: string | null, status: string, puzzleList?: string): boolean;
/**
 * Lookup the status of a puzzle
 * @param puzzle The name of a puzzle
 * @param defaultStatus The initial status, before a player updates it
 * @param puzzleList The relative path to the puzzle_list to update (omit if local)
 * @returns The saved status
 */
export declare function getPuzzleStatus(puzzle: string | null, defaultStatus?: string, puzzleList?: string): string | undefined;
/**
 * Return a list of puzzles we are tracking, which currently have the indicated status
 * @param status one of the valid status strings
 */
export declare function listPuzzlesOfStatus(status: string): string[];
/**
 * Clear the list of which puzzles have been saved, unlocked, etc.
 */
export declare function resetAllPuzzleStatus(): void;
/**
 * Clear any saved progress on this puzzle
 * @param puzzleFile a puzzle filename
 */
export declare function resetPuzzleProgress(puzzleFile: string): void;
/**
 * Load cached meta materials, if they have been acquired.
 * @param puzzle The meta-puzzle name
 * @param up Steps up from current folder where meta puzzle is found
 * @param page The meta-clue label (i.e. part 1 or B)
 * @returns An object - can be different for each meta type, or undefined if not unlocked
 */
export declare function loadMetaMaterials(puzzle: string, up: number, page: number): object | undefined;
/**
 * Load cached meta materials, if they have been acquired.
 * @param key The meta-piece name. Often a concatenation of the meta puzzle and a piece #
 * @returns An object - can be different for each meta type, or undefined if not unlocked
 */
export declare function loadMetaPiece(key: string): object | undefined;
/**
 * Get the last level of the URL's pathname
 */
export declare function getCurFileName(no_extension?: boolean): string;
/**
 * Utility for backdoor event reset pages
 * @param path A prefix to search for across all stored keys.
 * Because the storage pattern we use is to key off filenames,
 * specifying a folder will clear one event without clearing a second.
 */
export declare function forgetChildrenOf(path: string): number;
/**
 * Read any cached login-info. Logins are per-event
 * @param event The current event
 * @returns A login info, or null if not logged in
 */
export declare function getLogin(event?: string): LoginInfo | null;
/**
 * Save the login (or logged-out) info
 * @param event The current event
 * @param data What to save. Null means logged out.
 */
export declare function cacheLogin(event?: string, data?: LoginInfo): void;
