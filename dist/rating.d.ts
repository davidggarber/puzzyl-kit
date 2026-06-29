import { RatingDetails } from "./events";
/**
 * Create the Rating UI that lives above the top of the page (screen only).
 * @param fun If true, add the "fun" scale.
 * @param difficulty If true, add the "difficulty" scale.
 * @param feedback If true, add a button to provide verbatim feedback.
 */
export declare function createRatingUI(details: RatingDetails, margins: HTMLDivElement): void;
export declare function showRatingUI(show: boolean): void;
