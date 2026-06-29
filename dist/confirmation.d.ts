/**
 * A single guess submitted by a player, noting also when it was submitted
 */
export type GuessLog = {
    field: string;
    guess: string;
    time: Date;
};
/**
 * This puzzle has a validation block, so there must be either a place for the
 * player to propose an answer, or an automatic extraction for other elements.
 */
export declare function setupValidation(): void;
/**
 * When typing in an input connected to a validate button,
 * any non-empty string indicates ready (TODO: add other rules)
 * and ENTER triggers a button click
 * @param btn The button to enable/disable as ready
 * @param key What key was just typed, if any
 */
export declare function validateInputReady(btn: HTMLButtonElement, key: string | null): void;
/**
 * Validate a user's input against the encoded set of validations
 * @param gl the guess information, but not the response
 */
export declare function decodeAndValidate(gl: GuessLog): void;
/**
 * Expose the boilerplate as an export
 * Only called by code which is triggered by a boilerplate, so safely not null
 */
export declare function theValidation(): Record<string, any> | undefined;
