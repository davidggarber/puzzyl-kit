/**
 * On page load, look for any instances of elements tag with class names we respond to.
 * When found, expand those elements appropriately.
 */
export declare function textSetup(): void;
interface LetterStyles {
    letter: string;
    literal: string;
    extract: string;
    word: string;
    hidden: string;
}
/**
 * Look for the standard styles in the current tag, and all parents
 * @param elmt - A page element
 * @param defLetter - A default letter style
 * @param defLiteral - A default literal style
 * @param defExtract - A default extraction style
 * @returns An object with a style name for each role
 */
export declare function getLetterStyles(elmt: Element, defLetter: string, defLiteral: string | undefined, defExtract: string): LetterStyles;
/**
 * Setup a click handler on the page to help sloppy clickers find inputs
 * @param page
 */
export declare function clicksFindInputs(page: HTMLDivElement): void;
export {};
