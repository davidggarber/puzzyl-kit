export declare enum EventSyncActivity {
    Open = "Open",
    Edit = "Edit",
    Attempt = "Attempt",
    Unlock = "Unlock",
    Solve = "Solve"
}
export declare function setupEventSync(syncKey?: string, usageKey?: string): void;
export declare function pingEventServer(activity: EventSyncActivity, guess?: string): Promise<void>;
/**
 * Track the highest activity reached on the current puzzle.
 * @param activity
 */
export declare function trackPuzzleProgress(activity: EventSyncActivity): void;
/**
 * A login requires a player name, and optionally a team name
 */
export type LoginInfo = {
    team: string;
    player: string;
    emoji: string;
};
export declare function refreshTeamHomePage(callback?: SimpleCallback): Promise<void>;
export type PlayerPresence = {
    Player: string;
    Avatar: string;
    Presence?: string;
};
export interface SolveSummary {
    [key: string]: string;
}
export type UnlockedPiece = {
    Piece: string;
    Url: string;
};
type SimpleCallback = () => void;
/**
 * Useful URL for unlocked & loaded files, shared between teammates.
 * The recipient can then append their own search terms.
 * Equivalent to window.location.href -minus- window.location.search
 */
export declare function urlSansArgs(): string;
/**
 * Ping server when a meta feeder has been unlocked.
 * Called directly by the file in question, when it is first loaded.
 * @param metaFeeder "[meta]-[index]"
 * @param url The file's actual window.location.href
 */
export declare function syncUnlockedFile(metaFeeder: string, url: string): Promise<void>;
export declare function sendRating(aspect: string, val: number): Promise<void>;
export declare function sendFeedback(feedback: string): Promise<void>;
export {};
