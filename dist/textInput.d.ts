import { TextInputElement, ArrowKeyElement } from "./classUtil";
export declare function onInputEvent(event: KeyboardEvent): void;
/**
 * Callback when a user pressed a keyboard key from any letter-input or word-input text field
 * @param event - A keyboard event
 */
export declare function onLetterKeyDown(event: KeyboardEvent): void;
/**
 * Callback when a user pressed a keyboard key from any letter-input or word-input text field
 * @param event - A keyboard event
 */
export declare function onButtonKeyDown(event: KeyboardEvent): void;
/**
 * Callback when a user releases a keyboard key from any letter-input or word-input text field
 * @param event - A keyboard event
 */
export declare function onLetterKeyUp(event: KeyboardEvent): void;
/**
 * oninput callback, which is the only usable one we get on Android.
 * It should ALWAYS follow the key-down event
 * @param event - An input event, where .data holds the key
 */
export declare function onLetterInput(event: InputEvent): void;
/**
 * Process the end of a keystroke
 * @param evt - A keyboard event
 * @return true if some post-processing is still needed
 */
export declare function onLetterKey(evt: KeyboardEvent): boolean;
/**
 * Re-scan for extractions
 * @param input The input which just changed
 * @param key The key from the event that led here
 */
export declare function afterInputUpdate(input: TextInputElement, key: string): void;
/**
 * oninput callback, which is the only usable one we get on Android.
 * It should ALWAYS follow the key-down event
 * @param event - An input event, where .data holds the key
 */
export declare function onWordInput(event: InputEvent): void;
/**
 * User has typed in a word-entry field
 * @param event A Keyboard event
 */
export declare function onWordKey(event: KeyboardEvent): void;
/**
 * Update extractions that come from word input
 * @param extractedId The ID of an extraction area
 */
export declare function updateWordExtraction(extractedId: string | null): void;
/**
 * Extract a single letter from an input.
 * Can have a simple or two-part index.
 * Simple: an absolute index, starting at 1, ignoring whitespace
 * Two-part: word# and letter#, both starting at 1
 * @param input User's input string
 * @param index The primary index (starting at 1)
 * @param subIndex The secondary index (starting at 1), or 0 to only use the primary index
 * @param ifBlank What to return from blank inputs
 * @param ifOver What to return if the index is out of bounds
 * @returns The extracted letter, or else the blank or over fallbacks
 */
export declare function extractWordIndex(input: string, index: number, subIndex: number, ifBlank: string, ifOver: string): string;
/**
 * Callback when user has changed the text in a letter-input
 * @param event A keyboard event
 */
export declare function onLetterChange(event: KeyboardEvent): void;
/**
 * Callback when user has changed the text in a word-input
 * @param event A keyboard event
 */
export declare function onWordChange(event: KeyboardEvent): void;
/**
 * Autocomplete the contents of a multi-letter input from a restricted list of options.
 * Existing text must match the beginning of exactly one option (case-insensitive).
 * @param input a text <input> or <textarea>
 * @param list a list of potential values to complete to
 * @returns true if a single match was found, else false for 0 or multiple matches
 */
export declare function autoCompleteWord(input: HTMLInputElement | HTMLTextAreaElement, list: string[]): boolean;
/**
 * Set which element group the user is inputting into.
 * An element can be part of multiple groups. Usually, associated with differing directions.
 * If the same element is selected repeatedly, rotate among the associated groups.
 * @param elmt The element with the selection
 */
export declare function setCurrentInputGroup(elmt: ArrowKeyElement): void;
/**
 * When in an element group, arrow keys have additional meanings.
 * Arrow keys aligned with the group direction move within the group.
 * Arrow keys aligned with an alternate direction can indicate a different group.
 * In that case, switch groups, but do not move.
 * If the arrow does not match an alternate direction, simply move.
 * @param elmt The element with the selection
 * @param key The key that was pressed from within that element
 * @returns True if the arrow only switches group. False if it moves the selection.
 */
export declare function arrowFromInputGroup(elmt: ArrowKeyElement, code: string): boolean;
/**
 * Does a given element consider itself to be part of this named input group?
 * @param elmt An element to test, which may be in 0, 1, or more groups.
 * @param groupName An input group name to match, or if omitted, any group
 * @returns true if any of this elements groups matches the target group
 */
export declare function hasInputGroup(elmt: Element, groupName?: string | undefined): boolean;
/**
 * Some functions want to flexibly pull values from various constructs:
 *   - input elements
 *   - containers of multiple input elements
 * Extract an appropriate value to submit
 * @param container The container of the text value.
 * @param eachBlank The value to concatenate for each blank inputs.
 * @returns The value, or concatenation of values.
 */
export declare function getValueFromTextContainer(container: HTMLElement, eachBlank: string): string;
