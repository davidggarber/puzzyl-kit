import { TextInputElement } from "./classUtil";
import { TableDetails } from "./tableBuilder";
import { LinkDetails } from "./events";
import { MetaParams } from "./meta";
/**
 * Cache the original, pre-modified HTML, in case there is an error to point to
 */
export declare let _rawHtmlSource: string;
/**
 * Check the URL to see if a given argument has been set.
 * Doesn't matter what it's set to, if anything.
 * @param arg The name of an arg (lower-case)
 * @returns true if present in URL.
 */
export declare function urlArgExists(arg: string): boolean;
/**
 * Determines if the caller has specified <i>debug</i> in the URL
 * NOTE: Debug features can be intrusive. Rendering artifacts and alerts.
 * @returns true if set, unless explictly set to false
 */
export declare function isDebug(): boolean;
/**
 * Determines if the caller has specified <i>trace</i> in the URL
 * NOTE: Trace features should not be intrusive. Only console output.
 * @returns true if set, unless explictly set to false
 */
export declare function isTrace(): boolean;
/**
 * Determines if the caller has specified <i>body-debug</i> in the URL,
 * or else if the puzzle explictly has set class='debug' on the body.
 * @returns true if set, unless explictly set to false
 */
export declare function isBodyDebug(): boolean;
/**
 * Determines if this document is being loaded inside an iframe.
 * While any document could in theory be in an iframe, this library tags such pages with a url argument.
 * @returns true if this page's URL contains an iframe argument (other than false)
 */
export declare function isIFrame(): boolean;
/**
 * Determines if this document's URL was tagged with ?print
 * This is intended to as an alternative way to get a print-look, other than CSS's @media print
 * @returns true if this page's URL contains a print argument (other than false)
 */
export declare function isPrint(): boolean;
/**
 * Determines if this document's URL was tagged with ?icon
 * This is intended to as an alternative way to generate icons for each puzzle
 * @returns true if this page's URL contains a print argument (other than false)
 */
export declare function isIcon(): boolean;
/**
 * Identifies floating iframes, used to evoke modal dialogs.
 * @returns true if this page's URL contains a modal argument (other than false)
 */
export declare function isModal(): boolean;
/**
 * Special url arg to override any cached storage. Always restarts.
 * @returns true if this page's URL contains a restart argument (other than =false)
 */
export declare function isRestart(): boolean;
/**
 * Do we want to skip the UI that offers to reload?
 * @returns
 */
export declare function forceReload(): boolean | undefined;
type AbilityData = {
    textInput?: boolean | string;
    notes?: boolean;
    checkMarks?: boolean;
    highlights?: boolean;
    decoder?: boolean | string;
    dragDrop?: boolean | string;
    stamping?: boolean;
    straightEdge?: boolean;
    wordSearch?: boolean;
    hashiBridge?: boolean;
    subway?: boolean;
    scratchPad?: boolean;
};
export type BoilerPlateData = {
    event?: import('./events').PuzzleEventDetails;
    safari?: string;
    safaris?: string[];
    title?: string;
    titleSync?: string;
    noSync?: boolean;
    qr_base64?: string;
    print_qr?: boolean;
    author?: string;
    copyright?: string;
    type?: string;
    feeder?: string;
    lang?: string;
    paperSize?: string;
    orientation?: string;
    printAsColor?: boolean;
    abilities?: AbilityData;
    pathToRoot?: string;
    validation?: object;
    tableBuilder?: TableDetails;
    reactiveBuilder?: boolean | string;
    lookup?: object;
    preBuild?: () => void;
    postBuild?: () => void;
    preSetup?: () => void;
    postSetup?: () => void;
    metaParams?: MetaParams;
    googleFonts?: string;
    onNoteChange?: (inp: HTMLInputElement) => void;
    onInputChange?: (inp: TextInputElement) => void;
    onStampChange?: (newTool: string, prevTool: string) => void;
    onStamp?: (stampTarget: HTMLElement) => void;
    reloadOnRefresh?: boolean;
    onRestore?: () => void;
};
/**
 * Append any link tag to the header
 * @param head the head tag
 * @param det the attributes of the link tag
 */
export declare function addLink(head: HTMLHeadElement, det: LinkDetails): void;
/**
 * Append a CSS link to the header
 * @param relPath The contents of the link's href
 * @param head the head tag
 */
export declare function linkCss(relPath: string, head?: HTMLHeadElement): void;
/**
 * Expose the boilerplate as an export
 * Only called by code which is triggered by a boilerplate, so safely not null
 */
export declare function theBoiler(): BoilerPlateData;
export declare function testBoilerplate(bp: BoilerPlateData): void;
export {};
