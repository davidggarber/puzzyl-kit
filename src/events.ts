import { BoilerPlateData, urlArgExists } from "./boilerplate";
import { setGlobalLookup } from "./builderContext";

export type LinkDetails = {
  rel: string;  // 'preconnect', 'stylesheet', ...
  href: string;
  type?: string;  // example: 'text/css'
  crossorigin?: string;  // if anything, ''
}

type BackLinkDetails = {
  href: string;  // relative path
  friendly?: string;
}

// Any relative paths should be relative to the calling puzzle page's folder
export type PuzzleEventDetails = {
  eventClass?: string;  // CSS class to apply to all <body> elements of event pages
  title?: string;  // The event title (or sub-title, after "Safari ##")
  logo?: string;  // The event's banner logo - large scale
  icon?: string;  // The favicon for all puzzles of this event
  iconRoot?: string  // Folder for other icons - notably puzzle types, feeders, etc.
  puzzleList?: string;  // The URL of the index page for this event. A back-pointer from each puzzle
  puzzleListName?: string;
  cssRoot: string;  // Folder for CSS files for generic puzzle layout. Often shared across events.
  imageRoot: string;  // Folder for image files for this event
  fontCss?: string;  // Specific font stylesheet for this event
  googleFonts?: string;  // comma-delimited list of font names to load with Google APIs
  links: LinkDetails[];  // A list of additional link tags to add to every puzzle
  qr_folders?: { [key: string]: string};  // Folder for any QR codes
  solverSite?: string;  // URL to a separate solver website, where players can enter answers
  backLinks?: { [key: string]: BackLinkDetails };  // key: URL trigger -> puzzleListBackLink
  helpLink?: string;  // URL to a help page for every puzzle
  validation?: boolean|string;  // whether to allow local validation
  syncConfig?: EventSyncConfig;  // Optional sync configuration for this event
  getEventSync?: () => EventSyncConfig|undefined;  // When present, can be called to configure sync mode
  ratings?: RatingDetails;  // When present, show the rating UI on every puzzle
}

// Optional sync configurations
// Supports the same event being re-run, with a fresh set of 
export type EventSyncConfig = {
  eventName: string;  // Event name, suitable for display to users
  eventKey: string;  // A unique string for each event, to differentiate resources
  eventSync: string;  // Identifies the event on the server. *Required if any of the below is true*.
  hasLogin: boolean;  // If false, no attempt to get user identity at all. Any syncing is anonymous.
  hasTeams: boolean;   // If false, every player is solo or anonymous.
  syncSolves: boolean;  // If true, each user solve is sent to the server
  syncUsage: boolean;  // If true, do track finer-grain user progress
  offerRatings: RatingDetails;  // Which, if any, ratings UI to display
}

export type RatingDetails = {
  fun: boolean,
  difficulty: boolean,
  feedback: boolean
}

type puzzleListBackLink = {
  href: string;  // relative path
  friendly?: string;
}

const genericEventDetails: PuzzleEventDetails = {
  cssRoot: 'css/',
  imageRoot: 'images/',
  links: [],
  icon: 'favicon.png',
  logo: 'logo.png',
  validation: true,
};

// Runtime registry: event repos call registerEvent() at startup so that
// lookupSafari() and legacy string-ID paths can find their details.
const eventRegistry: { [key: string]: PuzzleEventDetails } = {};

export function registerEvent(id: string, details: PuzzleEventDetails): void {
  eventRegistry[id] = details;
}

let defaultEvent: PuzzleEventDetails | undefined;

export function registerDefaultEvent(details: PuzzleEventDetails): void {
  defaultEvent = details;
}

let safariDetails: PuzzleEventDetails;

/**
 * Initialize a global reference to Safari event details.
 *
 * New API: set boiler.event = <PuzzleEventDetails> directly from your event.ts.
 * Legacy API: set boiler.safari = '<id>' and call registerEvent(id, details) at startup.
 * Pages supporting multiple events can still use boiler.safaris = ['gs26', ...].
 */
export function initSafariDetails(boiler?: BoilerPlateData): PuzzleEventDetails {

  // New API: event details passed directly — no registry lookup needed
  if (boiler?.event) {
    safariDetails = boiler.event;
    return safariDetails;
  }

  safariDetails = defaultEvent ?? genericEventDetails;
  return safariDetails;
}

/**
 * Return the details of this puzzle event
 */
export function getSafariDetails(): PuzzleEventDetails {
  if (safariDetails) {
    // Details can specify a callback to set the event based on a URL arg, for example.
    // The first caller will lock it.
    if (!safariDetails.syncConfig && safariDetails.getEventSync) {
      safariDetails.syncConfig = safariDetails.getEventSync();
    }
    if (safariDetails.syncConfig) {
      setGlobalLookup('_safari_', safariDetails.syncConfig.eventKey);
      setGlobalLookup('_safari_name_', safariDetails.syncConfig.eventName);
      setGlobalLookup('_safari_sync_', safariDetails.syncConfig.eventSync);
    }
  }
  return safariDetails;
}

/**
 * Create a backlink to the puzzle list, subject to URL-arg prerequisites.
 */
export function backlinkFromUrl(): HTMLElement|undefined {
  if (!safariDetails || !safariDetails.backLinks) {
    return undefined;
  }
  const keys = Object.keys(safariDetails.backLinks);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key && urlArgExists(key)) {
      return createBacklink(safariDetails.backLinks[key]);
    }
  }
  if ('' in safariDetails.backLinks) {
    return createBacklink(safariDetails.backLinks[''] as puzzleListBackLink);
  }
  return undefined;
}

function createBacklink(backlink: puzzleListBackLink): HTMLAnchorElement {
  let a = document.createElement('a') as HTMLAnchorElement;
  a.id = 'backlink';
  a.innerText = backlink.friendly || 'Puzzle list';
  a.href = backlink.href + window.location.search;
  a.target = '_blank';
  return a;
}

/**
 * According to event rules, should we enable local validation?
 */
export function enableValidation(): boolean {
  if (safariDetails.validation === true) {
    return true;
  }
  if (safariDetails.validation === false || safariDetails.validation === undefined) {
    return false;
  }
  return urlArgExists(safariDetails.validation);
}

/**
 * Refer to a css file which should be in the event's cssRoot directory.
 * @param path relative path to the CSS file within the event's cssRoot directory.
 * @returns A relative path to the event src directory.
 */
export function eventRelCss(path: string): string {
  return (safariDetails?.cssRoot || 'css/') + path;
}

/**
 * Refer to an image file which should be in the event's imageRoot directory.
 * @param path relative path to the image file within the event's imageRoot directory.
 * @returns A relative path to the event src directory.
 */
export function eventRelImage(path: string): string {
  return (safariDetails?.imageRoot || 'images/') + path;
}

/**
 * Refer to an icon file which should be in the event's icon image directory.
 * @param path relative path to the icon file within the event's iconRoot directory,
 * or else the icons sub-folder under the imageRoot.
 * @returns A relative path to the event src directory.
 */
export function eventRelIcon(path: string): string {
  return (safariDetails?.iconRoot || eventRelImage('icons/')) + path;
}

/**
 * Refer to an stamp file which should be in the event's stamp image directory.
 * @param path relative path to the stamp file within the event's stamps sub-folder under the imageRoot.
 * @returns A relative path to the event src directory.
 */
export function eventRelStamp(path: string): string {
  return eventRelImage('stamps/') + path;
}

/**
 * Refer to an star file which should be in the event's star image directory.
 * @param path relative path to the star file within the event's stars sub-folder under the imageRoot.
 * @returns A relative path to the event src directory.
 */
export function eventRelStar(path: string): string {
  return eventRelImage('stars/') + path;
}