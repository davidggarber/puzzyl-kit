import { BoilerPlateData } from "./boilerplate";
export type LinkDetails = {
    rel: string;
    href: string;
    type?: string;
    crossorigin?: string;
};
type BackLinkDetails = {
    href: string;
    friendly?: string;
};
export type PuzzleEventDetails = {
    title?: string;
    logo?: string;
    icon?: string;
    iconRoot?: string;
    puzzleList?: string;
    puzzleListName?: string;
    cssRoot: string;
    fontCss?: string;
    googleFonts?: string;
    links: LinkDetails[];
    qr_folders?: {
        [key: string]: string;
    };
    solverSite?: string;
    backLinks?: {
        [key: string]: BackLinkDetails;
    };
    validation?: boolean | string;
    eventSync?: string;
    usageSync?: string;
    ratings?: RatingDetails;
};
export type RatingDetails = {
    fun: boolean;
    difficulty: boolean;
    feedback: boolean;
};
export declare function registerEvent(id: string, details: PuzzleEventDetails): void;
/**
 * Initialize a global reference to Safari event details.
 *
 * New API: set boiler.event = <PuzzleEventDetails> directly from your event.ts.
 * Legacy API: set boiler.safari = '<id>' and call registerEvent(id, details) at startup.
 * Pages supporting multiple events can still use boiler.safaris = ['gs26', ...].
 */
export declare function initSafariDetails(boiler?: BoilerPlateData): PuzzleEventDetails;
/**
 * Return the details of this puzzle event
 */
export declare function getSafariDetails(): PuzzleEventDetails;
/**
 * Create a backlink to the puzzle list, subject to URL-arg prerequisites.
 */
export declare function backlinkFromUrl(): HTMLElement | undefined;
/**
 * According to event rules, should we enable local validation?
 */
export declare function enableValidation(): boolean;
/**
 * Look up an event by ID, title, or eventSync key.
 * Only finds events that have been registered via registerEvent().
 */
export declare function lookupSafari(name: string): PuzzleEventDetails | null;
export {};
