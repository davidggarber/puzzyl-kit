import { clicksFindInputs, textSetup } from "./textSetup"
import { hasClass, TextInputElement, toggleClass } from "./classUtil"
import { setupNotes, setupCrossOffs, setupHighlights } from "./notes"
import { setupDecoderToggle } from "./decoders"
import { checkLocalStorage, indexAllDragDropFields, indexAllDrawableFields, TryParseJson } from "./storage";
import { preprocessStampObjects } from "./stampTools";
import { preprocessDragFunctions } from "./dragDrop";
import { EdgeTypes, preprocessRulerFunctions } from "./straightEdge";
import { TableDetails, constructTable } from "./tableBuilder";
import { setupSubways } from "./subway";
import { setupValidation, theValidation } from "./confirmation";
import { expandControlTags, hasBuilderElements } from "./builder";
import { LinkDetails, backlinkFromUrl, enableValidation, eventRelCss, eventRelStamp, getSafariDetails, initSafariDetails } from "./events";
import { diffSummarys, LayoutSummary, renderDiffs, summarizePageLayout } from "./testUtils";
import { wrapContextError } from "./contextError";
import { setupScratch } from "./scratch";
import { MetaParams, setupMetaSync } from "./meta";
import { setupEventSync } from "./eventSync";
import { preprocessSvgDragFunctions } from "./dragDropSvg";
import { createRatingUI } from "./rating";


/**
 * Cache the URL parameneters as a dictionary.
 * Arguments that don't specify a value receive a default value of true
 */
const urlArgs: Record<string, string | boolean> = {};

/**
 * Cache the original, pre-modified HTML, in case there is an error to point to
 */
export let _rawHtmlSource:string;

/**
 * Scan the url for special arguments.
 */
function debugSetup() {
    if (Object.keys(urlArgs).length > 0) {
        return;  // Only process once
    }
    var search = window.location.search;
    if (search !== '') {
        search = search.substring(1);  // trim leading ?
        var args = search.split('&');
        for (let i = 0; i < args.length; i++) {
            var toks = args[i].split('=');
            if (toks.length > 1) {
                urlArgs[toks[0].toLowerCase()] = toks[1];
            }
            else {
                urlArgs[toks[0].toLowerCase()] = true;  // e.g. present
            }
        }
    }
    if (urlArgs['body-debug'] != undefined && urlArgs['body-debug'] !== false) {
        toggleClass(document.getElementsByTagName('body')[0], 'debug', true);
    }
    if (urlArgs['compare-layout'] != undefined) {
        linkCss(eventRelCss('TestLayoutDiffs.css'));  // TODO: path
    }

    var isiPad = navigator.userAgent.match(/iPad/i) != null;
    toggleClass(document.getElementsByTagName('body')[0], 'iPad', isiPad);
}

/**
 * Check the URL to see if a given argument has been set.
 * Doesn't matter what it's set to, if anything.
 * @param arg The name of an arg (lower-case)
 * @returns true if present in URL.
 */
export function urlArgExists(arg:string):boolean {
    return urlArgs[arg] !== undefined;
}

/**
 * Determines if the caller has specified <i>debug</i> in the URL
 * NOTE: Debug features can be intrusive. Rendering artifacts and alerts.
 * @returns true if set, unless explictly set to false
 */
export function isDebug() {
    return urlArgs['debug'] != undefined && urlArgs['debug'] !== false;
}

/**
 * Determines if the caller has specified <i>trace</i> in the URL
 * NOTE: Trace features should not be intrusive. Only console output.
 * @returns true if set, unless explictly set to false
 */
export function isTrace() {
    return urlArgs['trace'] != undefined && urlArgs['trace'] !== false;
}

/**
 * Determines if the caller has specified <i>body-debug</i> in the URL,
 * or else if the puzzle explictly has set class='debug' on the body.
 * @returns true if set, unless explictly set to false
 */
export function isBodyDebug() {
    return hasClass(document.getElementsByTagName('body')[0], 'debug');
}

/**
 * Determines if this document is being loaded inside an iframe.
 * While any document could in theory be in an iframe, this library tags such pages with a url argument.
 * @returns true if this page's URL contains an iframe argument (other than false)
 */
export function isIFrame() {
    return urlArgs['iframe'] != undefined && urlArgs['iframe'] !== false;
}

/**
 * Determines if this document's URL was tagged with ?print
 * This is intended to as an alternative way to get a print-look, other than CSS's @media print
 * @returns true if this page's URL contains a print argument (other than false)
 */
export function isPrint() {
    return urlArgs['print'] != undefined && urlArgs['print'] !== false;
}

/**
 * Determines if this document's URL was tagged with ?icon
 * This is intended to as an alternative way to generate icons for each puzzle
 * @returns true if this page's URL contains a print argument (other than false)
 */
export function isIcon() {
    return urlArgs['icon'] != undefined && urlArgs['icon'] !== false;
}

/**
 * Identifies floating iframes, used to evoke modal dialogs.
 * @returns true if this page's URL contains a modal argument (other than false)
 */
export function isModal() {
    return urlArgs['modal'] != undefined && urlArgs['modal'] !== false;
}

/**
 * Special url arg to override any cached storage. Always restarts.
 * @returns true if this page's URL contains a restart argument (other than =false)
 */
export function isRestart() {
    // An individual puzzle can set rules
    if (theBoiler().reloadOnRefresh !== undefined) {
        return !theBoiler().reloadOnRefresh;
    }
    // Otherwise, url args can skip the UI
    return urlArgs['restart'] != undefined && urlArgs['restart'] !== false;
}

/**
 * Do we want to skip the UI that offers to reload?
 * @returns 
 */
export function forceReload(): boolean|undefined {
    // An individual puzzle can set rules
    if (theBoiler().reloadOnRefresh !== undefined) {
        return theBoiler().reloadOnRefresh;
    }
    // Otherwise, url args can skip the UI
    if (urlArgs['reload'] != undefined) {
        return urlArgs['reload'] !== false;
    }
    // Undefined invites a popup UI
    return undefined;
}


type AbilityData = {
    textInput?: boolean|string;  // true by default
    notes?: boolean;
    checkMarks?: boolean;
    highlights?: boolean;
    decoder?: boolean|string;  // If a string, should be Proper case
    dragDrop?: boolean|string;
    stamping?: boolean;
    straightEdge?: boolean;
    wordSearch?: boolean;
    hashiBridge?: boolean;
    subway?: boolean;
    scratchPad?: boolean;
}

export type BoilerPlateData = {
    event?: import('./events').PuzzleEventDetails;  // new: pass event details directly
    title?: string;
    titleSync?: string;  // Title override when syncing
    noSync?: boolean;
    qr_base64?: string;
    print_qr?: boolean;
    author?: string;
    copyright?: string;
    type?: string;  // todo: enum
    feeder?: string;
    lang?: string;  // en-us by default
    paperSize?: string;  // letter by default
    orientation?: string;  // portrait by default
    printAsColor?: boolean;  // true=color, false=grayscale, unset=unmentioned
    abilities?: AbilityData;  // booleans for various UI affordances
    pathToRoot?: string;  // By default, '.'
    validation?: object;  // a dictionary of input fields mapped to dictionaries of encoded inputs and encoded responses
    tableBuilder?: TableDetails;  // Arguments to table-generate the page content (DEPRECATE)
    reactiveBuilder?: boolean|string;  // invoke the new reactive builder
    lookup?: object;  // a dictionary of json data available to builder code
    preBuild?: () => void;  // invoked before the builder - i.e. to create templates
    postBuild?: () => void;  // invoked after the builder is done
    preSetup?: () => void;
    postSetup?: () => void;
    metaParams?: MetaParams;
    googleFonts?: string;  // A list of fonts, separated by commas
    onNoteChange?: (inp:HTMLInputElement) => void;
    onInputChange?: (inp:TextInputElement) => void;
    onStampChange?: (newTool:string, prevTool:string) => void;
    onStamp?: (stampTarget:HTMLElement) => void;
    reloadOnRefresh?: boolean;  // set to true to always reload, or false to always restart. undefined invites a UI.
    onRestore?: () => void;
}

const print_as_color = { id:'printAs', html:"<div style='color:#666;'>Print as <span style='color:#FF0000;'>c</span><span style='color:#538135;'>o</span><span style='color:#00B0F0;'>l</span><span style='color:#806000;'>o</span><span style='color:#7030A0;'>r</span>.</div>" };
const print_as_grayscale = { id:'printAs', text: "<div style='color:#666;'>Print as grayscale</div>"};

/**
 * Do some basic setup before of the page and boilerplate, before building new components
 * @param bp 
 */
function preSetup(bp:BoilerPlateData) {
    _rawHtmlSource = document.documentElement.outerHTML;
    debugSetup();
    const safariDetails = initSafariDetails(bp);
    var bodies = document.getElementsByTagName('body');
    if (isIFrame()) {
        bodies[0].classList.add('iframe');
    }
    if (isPrint()) {
        bodies[0].classList.add('print');
    }
    if (isIcon()) {
        bodies[0].classList.add('icon');
    }
    if (bp.pathToRoot) {
        if (safariDetails.logo) { 
            safariDetails.logo = bp.pathToRoot + '/' + safariDetails.logo;
        }
        if (safariDetails.icon) { 
            safariDetails.icon = bp.pathToRoot + '/' + safariDetails.icon;
        }
        if (safariDetails.puzzleList) { 
            safariDetails.puzzleList = bp.pathToRoot + '/' + safariDetails.puzzleList;
        }
    }
}

interface CreateSimpleDivArgs {
    id?: string;
    cls?: string;
    text?: string;  // raw text, which will be entitized
    html?: string;  // html code
}
function createSimpleDiv({id, cls, text, html}: CreateSimpleDivArgs) : HTMLDivElement {
    let div: HTMLDivElement = document.createElement('div') as HTMLDivElement;
    if (id !== undefined) {
        div.id = id;
    }
    if (cls !== undefined) {
        div.classList.add(cls);
    }
    if (text !== undefined) {
        div.appendChild(document.createTextNode(text));
    }
    else if (html !== undefined) {
        div.innerHTML = html;
    }
    return div;
}

interface CreateSimpleAArgs {
    id?: string;
    cls?: string;
    friendly: string;
    href: string;
    target?: string;
}
function createSimpleA({id, cls, friendly, href, target}: CreateSimpleAArgs) : HTMLAnchorElement {
    let a: HTMLAnchorElement = document.createElement('a') as HTMLAnchorElement;
    if (id !== undefined) {
        a.id = id;
    }
    if (cls !== undefined) {
        a.classList.add(cls);
    }
    a.innerHTML = friendly;
    a.href = href;
    a.target = target || '_blank';
    return a;
}

/**
 * Map puzzle types to alt text
 */
const iconTypeAltText = {
    'Word': 'Word puzzle',
    'Math': 'Math puzzle',
    'Rebus': 'Rebus puzzle',
    'Code': 'Features encodings',
    'Trivia': 'Trivia puzzle',
    'Meta': 'Meta puzzle',
    'Reassemble': 'Assembly'
}

/**
 * Create an icon appropriate for this puzzle type
 * @param data Base64 image data
 * @returns An img element, with inline base-64 data
 */
function createPrintQrBase64(data:string):HTMLImageElement {
    const qr = document.createElement('img');
    qr.id = 'qr';
    if (data.endsWith('.png')) {
        
    }
    else {
        qr.src = 'data:image/png;base64,' + data;
    }
    qr.alt = 'QR code to online page';
    return qr;
}

function getQrPath():string|undefined {
    const safariDetails = getSafariDetails();
    if (safariDetails.qr_folders) {
        const url = window.location.href;
        for (const key of Object.keys(safariDetails.qr_folders)) {
            if (url.indexOf(key) == 0) {
                let folder = safariDetails.qr_folders[key];
                const names = window.location.pathname.split('/');  // trim off path before last slash
                const name = names[names.length - 1].split('.')[0];  // trim off extension
                if (folder.includes('{}')) {
                    return folder.replace('{}', name);
                }
                if (!folder.endsWith('/')) {
                    folder +='/';
                }
                return folder + name + '.png';
            }
        }
    }
    return undefined;
}

function createPrintQr():HTMLImageElement|null {
    // Find relevant folder:
    const path = getQrPath();
    if (path) {
        const qr = document.createElement('img');
        qr.id = 'qr';
        qr.src = path;
        qr.alt = 'QR code to online page';
        return qr;
    }
    return null;
}

/**
 * Create an icon appropriate for this puzzle type
 * @param puzzleType the name of the puzzle type
 * @param icon_use the purpose of the icon
 * @returns A div element, to be appended to the pageWithinMargins
 */
function createTypeIcon(puzzleType:string, icon_use:string=''):HTMLDivElement {
    if (!icon_use) {
        icon_use = 'puzzle';
    }
    const iconDiv = document.createElement('div');
    iconDiv.id = 'icons';
    const icon = document.createElement('img');
    icon.id = 'icons-' + iconDiv.childNodes.length;
    icon.src = getSafariDetails().iconRoot + puzzleType.toLocaleLowerCase() + '.png';
    icon.alt = iconTypeAltText[puzzleType as keyof typeof iconTypeAltText] || (puzzleType + ' ' + icon_use);
    iconDiv.appendChild(icon);
    return iconDiv;
}

function boilerplate(bp: BoilerPlateData) {
    if (!bp) {
        return;
    }
    _boiler = bp;

    preSetup(bp)

    /* A puzzle doc must have this shape:
     *   <html>
     *    <head>
     *     <script>
     *      const boiler = { ... };        // Most fields are optional
     *     </script>
     *    </head>
     *    <body>
     *     <div id='pageBody'>
     *      // All page contents
     *     </div>
     *    </body>
     *   </html>
     *  
     * Several new objects and attibutes are inserted.
     * Some are univeral; some depend on boiler plate data fields.
     *   <html>
     *    <head></head>
     *    <body class='letter portrait'>            // new classes
     *     <div id='page' class='printedPage'>      // new layer
     *      <div id='pageWithinMargins'>            // new layer
     *       <div id='pageBody'>
     *        // All page contents
     *       </div>
     *       <div id='title'>[title]</div>          // new element
     *       <div id='copyright'>[copyright]</div>  // new element
     *       <a id='backlink'>Puzzle List</a>       // new element
     *      </div>
     *     </div>
     *    </body>
     *   </html>
     */

    if (bp.preBuild) {
        bp.preBuild();
    }
    if (bp.reactiveBuilder) {
        try {
            expandControlTags(bp.reactiveBuilder);
        }
        catch (ex) {
            const ctx = wrapContextError(ex);
            console.error(ctx.stack);  // Log, but then continue with the rest of the page
            if (isTrace() || isDebug()) {
                toggleClass(document.getElementsByTagName('body')[0],'build-error',true);
            }
        }
    }
    else if (hasBuilderElements(document)) {
        const warn = Error('WARNING: this page contains <build>-style elements.\nSet boiler.reactiveBuilder:true to engage.');
        console.error(warn);
    }

    if (bp.tableBuilder) {
        constructTable(bp.tableBuilder);
    }

    const html:HTMLHtmlElement = document.getElementsByTagName('html')[0] as HTMLHtmlElement;
    const head:HTMLHeadElement = document.getElementsByTagName('head')[0] as HTMLHeadElement;
    const body:HTMLBodyElement = document.getElementsByTagName('body')[0] as HTMLBodyElement;
    const pageBody:HTMLDivElement = document.getElementById('pageBody') as HTMLDivElement;

    if (bp.title) {
        document.title = bp.title;
    }
    
    html.lang = bp.lang || 'en-us';

    const safariDetails = getSafariDetails();
    for (let i = 0; i < safariDetails.links.length; i++) {
        addLink(head, safariDetails.links[i]);
    }

    const viewport = document.createElement('meta') as HTMLMetaElement;
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1'
    head.appendChild(viewport);

    if (safariDetails.fontCss) {
        linkCss(safariDetails.fontCss);
    }
    let gFonts = bp.googleFonts;
    if (safariDetails.googleFonts) {
        gFonts = safariDetails.googleFonts + (gFonts ? (',' + gFonts) : '');
    }
    if (gFonts) {
        //<link rel="preconnect" href="https://fonts.googleapis.com">
        const gapis = {
            'rel': 'preconnect',
            'href': 'https://fonts.googleapis.com'
        };
        addLink(head, gapis);
        //<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        const gstatic = {
            'rel': 'preconnect',
            'href': 'https://fonts.gstatic.com',
            'crossorigin': ''
        };
        addLink(head, gstatic);

        const fonts = gFonts.split(',');
        const link = {
            'href': 'https://fonts.googleapis.com/css2?family=' + fonts.join('&family=') + '&display=swap',
            'rel': 'stylesheet'
        }
        addLink(head, link);
    }
    linkCss(safariDetails.cssRoot + 'PageSizes.css');
    linkCss(safariDetails.cssRoot + 'TextInput.css');
    if (!bp.paperSize) {
        bp.paperSize = 'letter';
    }
    if (!bp.orientation) {
        bp.orientation = 'portrait';
    }
    if (bp.paperSize.indexOf('|') > 0) {
        const ps = bp.paperSize.split('|');
        bp.paperSize = isPrint() ? ps[1] : ps[0];
    }
    toggleClass(body, bp.paperSize);
    toggleClass(body, bp.orientation);

    setupEventSync(safariDetails.eventSync, safariDetails.usageSync);

    const page: HTMLDivElement = createSimpleDiv({id:'page', cls:'printedPage'});
    const margins: HTMLDivElement = createSimpleDiv({cls:'pageWithinMargins'});
    body.appendChild(page);
    page.appendChild(margins);
    margins.appendChild(pageBody);
    if (bp.title) {
        margins.appendChild(createSimpleDiv({cls:'title', text:bp.title}));
    }
    else {
        toggleClass(body, 'no-title', true);
    }
    if (bp.copyright || bp.author) {
        margins.appendChild(createSimpleDiv({id:'copyright', text:'© ' + (bp.copyright || '') + ' ' + (bp.author || '')}));
    }
    const backlink = backlinkFromUrl();
    if (backlink) {
        margins.appendChild(backlink);
    }
    if (bp.printAsColor !== undefined) {
        margins.appendChild(createSimpleDiv(bp.printAsColor ? print_as_color : print_as_grayscale));
    }

    if (safariDetails.icon) {
        // Set tab icon for safari event
        const tabIcon = document.createElement('link');
        tabIcon.rel = 'shortcut icon';
        tabIcon.type = 'image/png';
        tabIcon.href = safariDetails.icon;
        head.appendChild(tabIcon);
    }

    if (bp.qr_base64) {
        margins.appendChild(createPrintQrBase64(bp.qr_base64, ));
    }
    else if (bp.print_qr) {
        const qrImg = createPrintQr();
        if (qrImg) {
            margins.appendChild(qrImg);
        }
    }

    if (bp.type) {
        margins.appendChild(createTypeIcon(bp.type));
    }
    if (bp.feeder) {
        margins.appendChild(createTypeIcon(bp.feeder, 'feeder'));
    }

    // If the puzzle has a pre-setup method they'd like to run before abilities and contents are processed, do so now
    if (bp.preSetup) {
        bp.preSetup();
    }

    setupAbilities(head, margins, bp.abilities || {});

    if (enableValidation() && theValidation()) {
        linkCss(safariDetails.cssRoot + 'Guesses.css');
        setupValidation();
    }

    if (safariDetails?.ratings) {
        linkCss(safariDetails.cssRoot + 'Ratings.css');
        createRatingUI(safariDetails?.ratings, margins);
    }

    if (!isIFrame()) {
        setTimeout(checkLocalStorage, 100);
    }
}

function debugPostSetup() {
    if (urlArgs['scan-layout'] != undefined) {
        const summary = summarizePageLayout();
        const json = JSON.stringify(summary);
        const comment = document.createComment(json);
        document.getRootNode().appendChild(comment);
    }
    if (urlArgs['compare-layout'] != undefined) {
        const after = summarizePageLayout();
        const root = document.getRootNode();
        for (let i = 0; i < root.childNodes.length; i++) {
            if (root.childNodes[i].nodeType == Node.COMMENT_NODE) {
                const comment = root.childNodes[i] as Comment;
                let commentJson = comment.textContent;
                if (commentJson) {
                    commentJson = commentJson.trim();
                    if (commentJson.substring(0, 7) == 'layout=') {
                        const before = TryParseJson(commentJson.substring(7)) as LayoutSummary;
                        const diffs = diffSummarys(before, after);
                        if (diffs.length > 0) {
                            renderDiffs(diffs);                            
                        }        
                        break;
                    }
                }
            }
        }
    }

}

function theHead(): HTMLHeadElement {
    return document.getElementsByTagName('head')[0] as HTMLHeadElement;
}

function baseHref(): string {
    const bases = document.getElementsByTagName('base');
    for (let i = 0; i < bases.length; i++) {
        var href = bases[i].getAttribute('href');
        if (href) {
            return relHref(href, document.location.href || '');
        }
    }
    return document.location.href;
}

function relHref(path:string, fromBase?:string): string {
    const paths = path.split('/');
    if (paths[0].length == 0 || paths[0].indexOf(':') >= 0) {
        // Absolute path
        return path;
    }
    if (fromBase === undefined) {
        fromBase = baseHref();
    }
    const bases = fromBase.split('/');
    bases.pop();  // Remove filename at end of base path
    let i = 0;
    for (; i < paths.length; i++) {
        if (paths[i] == '..') {
            if (bases.length == 0 || (bases.length == 1 && bases[0].indexOf(':') > 0)) {
                throw new Error('Relative path beyond base: ' + path);
            }
            bases.pop();
        }
        else if (paths[i] != '.') {
            bases.push(paths[i]);
        }
    }
    return bases.join('/');
}

/**
 * Count-down before we know all delay-linked CSS have been loaded
 */
let cssToLoad = 1;

/**
 * Append any link tag to the header
 * @param head the head tag
 * @param det the attributes of the link tag
 */
export function addLink(head:HTMLHeadElement, det:LinkDetails) {
    head = head || theHead();
    const link = document.createElement('link');
    link.href = relHref(det.href);
    link.rel = det.rel;
    if (det.type) {
        link.type = det.type;
    }
    if (det.crossorigin != undefined) {
        link.crossOrigin = det.crossorigin;
    }
    if (det.rel.toLowerCase() == "stylesheet") {
        link.onload = function(){cssLoaded();};
        cssToLoad++;
    }
    head.appendChild(link);
}

const linkedCss: Record<string, boolean> = {};

/**
 * Append a CSS link to the header
 * @param relPath The contents of the link's href
 * @param head the head tag
 */
export function linkCss(relPath:string, head?:HTMLHeadElement) {
    if (relPath in linkedCss) {
        return;  // Don't re-add
    }
    linkedCss[relPath] = true;
    
    head = head || theHead();
    const link = document.createElement('link');
    link.href = relHref(relPath);
    link.rel = "Stylesheet";
    link.type = "text/css";
    link.onload = function(){cssLoaded();};
    cssToLoad++;
    head.appendChild(link);
}

/**
 * Each CSS file that is delay-linked needs time to load.
 * Decrement the count after each one.
 * When complete, call final setup step.
 */
function cssLoaded() {
    if (--cssToLoad == 0) {
        setupAfterCss(theBoiler());
    }
}

/**
 * For each ability set to true in the AbilityData, do appropriate setup,
 * and show an indicator emoji or instruction in the bottom corner.
 * Back-compat: Scan the contents of the <ability> tag for known emoji.
 */
function setupAbilities(head:HTMLHeadElement, margins:HTMLDivElement, data:AbilityData) {
    const safariDetails = getSafariDetails();
    const page = (margins.parentNode || document.getElementById('page') || margins) as HTMLDivElement;

    if (data.textInput !== false) {  // If omitted, default to true
        textSetup()
        if (data.textInput == 'nearest') {
            clicksFindInputs(page);
        }
    }

    let ability = document.getElementById('ability');
    if (ability != null) {
        const text = ability.innerText;
        if (text.search('✔️') >= 0) {
            data.checkMarks = true;
        }
        if (text.search('💡') >= 0) {
            data.highlights = true;
        }
        if (text.search('👈') >= 0) {
            data.dragDrop = true;
        }
        if (text.search('✒️') >= 0) {
            data.stamping = true;
        }
    }
    else {
        ability = document.createElement('div');
        ability.id = 'ability';
        page.appendChild(ability);
    }
    let fancy = '';
    let count = 0;
    if (data.checkMarks) {
        setupCrossOffs();
        fancy += '<span id="check-ability" title="Click items to check them off">✔️</span>';
        count++;
    }
    if (data.highlights) {
        let instructions = "Ctrl+click to highlight cells";
        if (theBoiler()?.abilities?.textInput) {
            instructions = "Type ` or ctrl+click to highlight cells";
        }
        fancy += '<span id="highlight-ability" title="' + instructions + '" style="text-shadow: 0 0 3px black;">💡</span>';
        setupHighlights();
        count++;
    }
    if (data.dragDrop !== undefined && data.dragDrop !== false) {
        fancy += '<span id="drag-ability" title="Drag &amp; drop enabled" style="text-shadow: 0 0 3px black;">👈</span>';
        if (typeof(data.dragDrop === 'string')) {
            preprocessSvgDragFunctions(data.dragDrop as string);
            indexAllDragDropFields();
            linkCss(safariDetails.cssRoot + 'DragDropSvg.css');
        }
        else {
            preprocessDragFunctions();
            indexAllDragDropFields();
            linkCss(safariDetails.cssRoot + 'DragDrop.css');
        }
        count++;
    }
    if (data.stamping) {
        // Review: ability icon
        fancy += '<span id="stamp-ability" title="Click on objects to interact"><img id="stamp-ability-icon" src="' 
            + eventRelStamp('stamp-glow.png') + '" style="height:22px;" /></span>';
        preprocessStampObjects();
        indexAllDrawableFields();
        linkCss(safariDetails.cssRoot + 'StampTools.css');
    }
    if (data.straightEdge) {
        fancy += '<span id="drag-ability" title="Line-drawing enabled" style="text-shadow: 0 0 3px black;">📐</span>';
        preprocessRulerFunctions(EdgeTypes.straightEdge, false);
        linkCss(safariDetails.cssRoot + 'StraightEdge.css');
        //indexAllVertices();
    }
    if (data.wordSearch) {
        fancy += '<span id="drag-ability" title="word-search enabled" style="text-shadow: 0 0 3px black;">💊</span>';
        preprocessRulerFunctions(EdgeTypes.wordSelect, true);
        linkCss(safariDetails.cssRoot + 'WordSearch.css');
        //indexAllVertices();
    }
    if (data.hashiBridge) {
        // fancy += '<span id="drag-ability" title="word-search enabled" style="text-shadow: 0 0 3px black;">🌉</span>';
        preprocessRulerFunctions(EdgeTypes.hashiBridge, true);
        linkCss(safariDetails.cssRoot + 'HashiBridge.css');
        //indexAllVertices();
    }
    if (data.subway) {
        linkCss(safariDetails.cssRoot + 'Subway.css');
        // Don't setupSubways() until all styles have applied, so CSS-derived locations are final
    }
    if (data.notes) {
        setupNotes(margins);
        // no ability icon
    }
    if (data.scratchPad) {
        setupScratch();
        let instructions = "Ctrl+click anywhere on the page to create a note.";
        fancy += '<span id="highlight-ability" title="' + instructions + '" style="text-shadow: 0 0 3px black;">📔</span>';
    }
    if (data.decoder) {
        setupDecoderToggle(page, data.decoder);
    }
    ability.innerHTML = fancy;
    ability.style.bottom = data.decoder ? '4pt' : '20pt';
    if (count == 2) {
        ability.style.right = '0.6in';
    }

    // Release our lock on css loading
    cssLoaded();
}

/**
 * All delay-linked CSS files are now loaded. Layout should be complete.
 * @param bp The global boilerplate
 */
function setupAfterCss(bp: BoilerPlateData) {
    if (bp.abilities) {
        if (bp.abilities.subway) {
            setupSubways();
        }
    }

    // If the puzzle has a post-setup method they'd like to run after all abilities and contents are processed, do so now
    if (bp.postSetup) {
        bp.postSetup();
    }
    if (bp.metaParams) {
        // Process metas after page is otherwise fully setup
        setupMetaSync(bp.metaParams);
    }

    debugPostSetup();
}

declare global {
  var boiler: BoilerPlateData | undefined;
}

/**
 * We forward-declare boiler, which we expect calling pages to define.
 * @returns The page's boiler, if any. Else undefined.
 */
function pageBoiler():BoilerPlateData | undefined {
    if (typeof globalThis.boiler !== 'undefined') {
        return globalThis.boiler as BoilerPlateData;
    }
    if (typeof window.boiler !== 'undefined') {
        return window.boiler as BoilerPlateData;
    }
    return undefined;
}

let _boiler: BoilerPlateData = {};

/**
 * Expose the boilerplate as an export
 * Only called by code which is triggered by a boilerplate, so safely not null
 */
export function theBoiler():BoilerPlateData {
    return _boiler;
}

export function testBoilerplate(bp:BoilerPlateData) {
    boilerplate(bp);
}

if (typeof window !== 'undefined') {
    window.addEventListener('load', function(e) {boilerplate(pageBoiler()!)});
}
