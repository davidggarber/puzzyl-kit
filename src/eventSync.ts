import { isIcon, isIFrame, isModal, isPrint, theBoiler } from "./boilerplate";
import { consoleTrace } from "./builder";
import { setGlobalLookup } from "./builderContext";
import { hasClass, toggleClass } from "./classUtil";
import { eventRelIcon, EventSyncConfig, PuzzleEventDetails, RatingDetails } from "./events";
import { showRatingUI } from "./rating";
import { cacheLogin, getLogin, getPuzzleStatus, TryParseJson, updatePuzzleList } from "./storage";

export enum EventSyncActivity {
  Open = "Open",
  Edit = "Edit",
  Attempt = "Attempt",
  Unlock = "Unlock",
  Solve = "Solve",
}

// Convert either EventSyncActivity or PuzzleStatus to a relative order
// All lower-case, to avoid ambiguity
// TODO: merge the two systems
let ActivityRank:{[key: string]: number} = {
  "hidden": -1,
  "locked": 0,
  "open": 1,
  "loaded": 1,
  "edit": 2,
  "attempt": 3,
  "unlock": 4,
  "unlocked": 4,
  "solve": 5,
  "solved": 5,
}

function isLocalSync(): boolean {
  if (window && typeof window !== 'undefined') {
    const u = new URL(window.location.href);
    return u.protocol  == 'file:' || u.host.startsWith('127.0.0.1:');
  }
  return true;
}

// Support testing against a local Sync server.
// Note: test environment does not define 'window'
const localSync = isLocalSync();

class SyncDetails implements EventSyncConfig {
  eventName: string;
  eventKey: string;
  eventSync: string;
  hasLogin: boolean;
  hasTeams: boolean;
  syncSolves: boolean;
  syncUsage: boolean;
  offerRatings: RatingDetails;

  // extend the event config with current-puzzle and current-user details
  canSync: boolean;  // Are we syncing this puzzle? Even if the rest of the event is.
  playerName?: string;
  teamName?: string;
  emojiAvatar?: string;
  mostProgress: number;

  constructor(details?: EventSyncConfig) {
    this.canSync = !!details && !!details.eventName
      && !theBoiler().noSync    // Don't sync if boiler has an explicit noSync=true
      && !isPrint() && !isIcon() && (!isIFrame() || isModal());  // Don't sync when printing

    // If no details, all syncing is off
    this.eventName = details?.eventName || '';
    this.eventKey = details?.eventKey || '_';  // generic should not be blank
    this.eventSync = details?.eventSync || '';
    this.hasLogin = details?.hasLogin || false;
    this.hasTeams = details?.hasTeams || false;
    this.syncSolves = details?.syncSolves || false;
    this.syncUsage = details?.syncUsage || false;
    this.offerRatings = details?.offerRatings || { fun: false, difficulty: false, feedback: false };

    // Player details await login
    this.playerName = undefined;
    this.teamName = undefined;
    this.emojiAvatar = undefined;
    this.mostProgress = -1;
  }

  public updatePlayerLookup() {
    // Update the lookup with the current player name
    setGlobalLookup('_player_name_', this.playerName);
    setGlobalLookup('_player_emoji_', this.emojiAvatar);
    setGlobalLookup('_team_name_', this.teamName);
  }
}

let _syncDetails = new SyncDetails();  // syncing off until setup below

export function getSyncDetails(): SyncDetails {
  return _syncDetails;
}

/**
 * Initialize sync globals
 * @param ped Event details
 */
export function preSetupEventSync(ped: PuzzleEventDetails) {
  if (!ped.syncConfig) {
    _syncDetails.updatePlayerLookup();
    return;
  }

  _syncDetails = new SyncDetails(ped.syncConfig);
  _syncDetails.updatePlayerLookup();
  autoLogin(false);
}

function puzzleTitleForSync():string|undefined {
  return theBoiler().titleSync || theBoiler().title;
}

/**
 * Initialize listeners
 * Update UI
 * @param ped Event details
 */
export function setupEventSync(ped: PuzzleEventDetails) {
  if (_syncDetails.canSync) {
    document.addEventListener('visibilitychange', function (event) { autoLogin(); });
    var body = document.getElementsByTagName('body')[0];
    body?.addEventListener('focus', function (event) { autoLogin(); });

    // Run immediately
    autoLogin();
  }
}

export async function pingEventServer(activity:EventSyncActivity, guess?:string) {
  trackPuzzleProgress(activity);

  if (!_syncDetails.canSync || !_syncDetails.playerName) {
    return;
  }

  const data = {
    eventName: _syncDetails.eventSync,
    player: _syncDetails.playerName,
    avatar: _syncDetails.emojiAvatar,
    team: _syncDetails.teamName,
    puzzle: puzzleTitleForSync(),
    activity: activity,
    data: guess || ''
  };

  await callSyncApi("PuzzlePing", data);
}

/**
 * Track the highest activity reached on the current puzzle.
 * @param activity 
 */
export function trackPuzzleProgress(activity:EventSyncActivity) {
  if (!_syncDetails.syncUsage){
    return;
  }
  const puzzle = puzzleTitleForSync();
  if (!puzzle) {
    return;
  }

  let newProgress = ActivityRank[activity.toLowerCase()];
  if (newProgress > _syncDetails.mostProgress) {
    // _syncDetails.mostProgress tracks the current in-browser instance
    _syncDetails.mostProgress = newProgress;

    // Look in local storage for earlier instances
    const store = 'Usage-Milestone-' + _syncDetails.eventSync;
    const cached = getPuzzleStatus(puzzle, undefined, store)?.toLowerCase() || '';
    if (!cached || !(cached in ActivityRank) || (ActivityRank[cached] < newProgress)) {
      // We have gotten farther on this puzzle than we have in the past
      const data = {
        eventName: _syncDetails.eventSync,
        puzzle: puzzle,
        activity: activity,
      };
      callSyncApi("Usage", data);  // don't await
      updatePuzzleList(puzzle, activity, store);
    }
  }
}

/**
 * A login requires a player name, and optionally a team name
 */
export type LoginInfo = {
  team: string,
  player: string,
  emoji: string,
}

/**
 * Log in to an event
 * @param player The name of the player (required)
 * @param team The player's team name (optional)
 * @param emoji The player's emoji avatar (optional)
 */
export function doLogin(player:string, team?:string, emoji?:string) {
  _syncDetails.playerName = player;
  _syncDetails.teamName = team;
  _syncDetails.emojiAvatar = emoji;
  const info:LoginInfo = {
      player: player,
      team: team || '',
      emoji: emoji || '',  // IDEA: initials
  };
  cacheLogin(_syncDetails.eventName, info);
  pingEventServer(EventSyncActivity.Open);
  updateLoginUI();
}

/**
 * Clear any cached login info
 * @param isModal If true, helper functions are called on parent. Else, called in local frame.
 * @param deletePlayer If true, tell the server to forget the player. This is async. Else, do nothing async.
 */
export async function doLogout(isModal:boolean, deletePlayer?:boolean) {
  if (deletePlayer) {
    const data = {
      eventName: _syncDetails.eventSync,
      player: _syncDetails.playerName,
      avatar: _syncDetails.emojiAvatar,
      team: _syncDetails.teamName,
    };
    let callback:SyncCallback|undefined = undefined;
    try {
      callback = !isModal ? autoLogin
        : 'autoLogin' in parent ? (parent['autoLogin'] as SyncCallback)
        : undefined;
    }
    catch {
      // Will fail when running on local file: protocol
    }
    await callSyncApi("DeletePlayer", data, undefined, callback);
  }

  cacheLogin(_syncDetails.eventName, undefined);
  _syncDetails.playerName = _syncDetails.teamName = _syncDetails.emojiAvatar = undefined;
  updateLoginUI();
}

/**
 * Try to join an existing log-in. 
 * Does not prompt the user; only uses cached info.
 * @param updateUI If true, update the login UI with login info.
 */
function autoLogin(updateUI:boolean=true) {
  if (!_syncDetails.canSync) {
    return;
  }
  const info = getLogin(_syncDetails.eventName);
  if (info && (_syncDetails.playerName != info.player || _syncDetails.teamName != info?.team)) {
    _syncDetails.playerName = info.player;
    _syncDetails.teamName = info.team || '';  // if missing, player is solo
    _syncDetails.emojiAvatar = info.emoji || '';
    pingEventServer(EventSyncActivity.Open);
  }
  else if (!info || !info.player) {
    _syncDetails.playerName = _syncDetails.teamName = _syncDetails.emojiAvatar = undefined;
  }
  if (updateUI) {
    updateLoginUI();
  }
}

/**
 * Ask the user for their username, and optionally team name (via @ suffix)
 * If they provide them, log them in.
 */
function promptLogin(evt:MouseEvent) {
  evt.stopPropagation();
  dismissLogin(null);
  let modal = document.getElementById('modal-login') as HTMLDivElement;
  let iframe = document.getElementById('modal-iframe') as HTMLIFrameElement;
  if (!modal) {
    modal = document.createElement('div');
    const content = document.createElement('div');
    const close = document.createElement('span');
    iframe = document.createElement('iframe');
    modal.id = 'modal-login';
    iframe.id = 'modal-iframe';
    toggleClass(content, 'modal-content', true);
    toggleClass(close, 'modal-close', true);
    close.appendChild(document.createTextNode("×"));
    close.title = 'Close';
    close.onclick = function(e) {dismissLogin(e)};
    content.appendChild(close);
    content.appendChild(iframe);
    modal.appendChild(content);
  
    document.getElementById('pageBody')?.appendChild(modal);  // first child of <body>
    document.getElementById('pageBody')?.addEventListener('click', function(event) {dismissLogin(event)});  
  }

  iframe.src = `LoginUI.xhtml?iframe&modal&${_syncDetails.eventKey}`;
  toggleClass(modal, 'hidden', false);
}

export function dismissLogin(evt:MouseEvent|null) {
  var modal = document.getElementById('modal-login');
  if (modal) {
    if (!hasClass(modal, 'hidden')) {
      toggleClass(modal, 'hidden', true);
      autoLogin();
      refreshTeamHomePage();
    }
  }
  if (evt) {
    evt.stopPropagation();
  }
}

function updateLoginUI() {
  if (!_syncDetails.hasLogin) {
    return;
  }
  _syncDetails.updatePlayerLookup();
  let div = document.getElementById('Login-bar');
  const body = document.getElementsByTagName('body')[0];
  if (!div) {
    div = document.createElement('div');
    div.id = 'Login-bar';
    document.getElementsByTagName('body')[0].appendChild(div);
  }
  let img:HTMLImageElement = document.getElementById('Login-icon') as HTMLImageElement;
  if (!img) {
    img = document.createElement('img');
    img.id = 'Login-icon';
    div.appendChild(img);
  }
  let avatar = document.getElementById('Login-avatar');
  if (!avatar) {
    avatar = document.createElement('span');
    avatar.id = 'Login-avatar';
    div.appendChild(avatar);
  }
  let span = document.getElementById('Login-player');
  if (!span) {
    span = document.createElement('span');
    span.id = 'Login-player';
    div.appendChild(span);
  }

  toggleClass(body, 'logged-in-player', !!_syncDetails.playerName);
  toggleClass(body, 'logged-in-avatar', !!_syncDetails.emojiAvatar);
  toggleClass(body, 'logged-in-team', !!_syncDetails.teamName);
  toggleClass(div, 'logged-in', !!_syncDetails.playerName);
  toggleClass(div, 'avatar', !!_syncDetails.emojiAvatar);
  if (_syncDetails.playerName) {
    // Logged in
    if (_syncDetails.emojiAvatar) {
      avatar.innerText = _syncDetails.emojiAvatar;
    }
    else {
      img.src = _syncDetails.teamName ? eventRelIcon("logged-in-team.png") : eventRelIcon("logged-in.png");
      avatar.innerHTML = '';
    }
    span.innerText = _syncDetails.teamName ? (_syncDetails.playerName + ' @ ' + _syncDetails.teamName) : _syncDetails.playerName;
    div.onclick = function(e) { promptLogin(e);};
    div.title = "Log out?";
    showRatingUI(true);
  }
  else {
    // Logged out
    img.src = eventRelIcon("logged-out.png");
    avatar.innerHTML = '';
    span.innerText = "Login?";
    div.onclick = function(e) { promptLogin(e);};
    div.title = "Log in?";
    // showRatingUI(false);
  }
}

type SyncCallback = (json:any) => void;

async function callSyncApi(apiName:string, data:object, jsonCallback?:SyncCallback, textCallback?:SyncCallback) {
  try {
      var xhr = new XMLHttpRequest();
      var url = (localSync ? "http://localhost:7071/api/"
          : "https://puzzyleventsync.azurewebsites.net/api/")
          + apiName;

      xhr.open("POST", url, true /*async*/);
      xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 /*DONE*/) {
          consoleTrace(xhr.responseText);
          let response:any = xhr.responseText;
          let isText = true;
          try {
              var obj = TryParseJson(response, false);
              isText = false;  // it's json
              if (jsonCallback) {
                  jsonCallback(obj);
              }
          }
          catch (ex){
            // Most likely problem is that xhr.responseText isn't JSON
            response = xhr.responseText || xhr.statusText;
            console.error(ex);
          }
          if (isText && textCallback) {
            textCallback(response);
          }
      }
      };
      var strData = JSON.stringify(data);
      consoleTrace(`Calling ${apiName} with data=${strData}`);
      xhr.send(strData);
  }
  catch (ex) {
    console.error(ex);
  }
}

export async function refreshTeamHomePage(callback?:SimpleCallback) {
  if (!_syncDetails.canSync || !_syncDetails.teamName) {
    _teamSyncData = blankTeamSyncData();
    if (callback) {
      callback();
    }
    else if (_onTeamHomePageRefresh) {
      _onTeamHomePageRefresh();
    }
    return;
  }

  const data = {
    eventName: _syncDetails.eventSync,
    team: _syncDetails.teamName,
    player: _syncDetails.playerName,  // not used, but handy for logging
  };

  if (callback) {
    _onTeamHomePageRefresh = callback;
  }
  else {
    callback = _onTeamHomePageRefresh;
  }
  if (_onTeamHomePageRefresh) {
    await callSyncApi('TeamHomePage', data, onRefreshTeamHomePage);
  }
}

export type PlayerPresence = {
  Player: string;
  Avatar: string;
  Presence?: string;
}

export type PlayerAvatar = {
  Player: string;
  Avatar: string;
}

export type PuzzleSolvers = {
  PuzzleName: string;
  Solvers: PlayerAvatar[];
}

export type SolveSummary = Record<string, PlayerAvatar[]>
// {
//   [key: string]: string // Key is puzzle name, value is concatenated avatars
// }

export type UnlockedPiece = {
  PuzzleName: string;
  Url: string;
}

export type TeamSyncData = {
  teamMates: PlayerPresence[];
  teamSolves: SolveSummary;
  remoteUnlocked: UnlockedPiece[];
}
function blankTeamSyncData(): TeamSyncData {
  return {
    teamMates: [],
    teamSolves: {},
    remoteUnlocked: []
  };
}
let _teamSyncData: TeamSyncData = blankTeamSyncData();
export function getTeamSyncData(): TeamSyncData {
  return _teamSyncData;
}

type SimpleCallback = () => void;

let _onTeamHomePageRefresh:SimpleCallback|undefined = undefined;


function onRefreshTeamHomePage(json:object) {
  if (json == null) {
    return;
  }
  var update = false;
  if ('teammates' in json) {
    _teamSyncData.teamMates = json['teammates'] as PlayerPresence[];
    update = true;
  }

  if ('solves' in json) {
    const solves = json['solves'] as PuzzleSolvers[];
    // Convert the array of PuzzleSolvers into a SolveSummary
    _teamSyncData.teamSolves = solves.reduce((acc, ps) => {
      acc[ps.PuzzleName] = ps.Solvers;
      return acc;
    }, {} as SolveSummary);
    update = true;
  }

  if ('unlocked' in json) {
    _teamSyncData.remoteUnlocked = json['unlocked'] as UnlockedPiece[];
    update = true;
  }

  if (update && _onTeamHomePageRefresh) {
    _onTeamHomePageRefresh();
  }
}

/**
 * Useful URL for unlocked & loaded files, shared between teammates.
 * The recipient can then append their own search terms.
 * Equivalent to window.location.href -minus- window.location.search
 */
export function urlSansArgs():string {
  return window.location.protocol + "//" + window.location.host + window.location.pathname;
}

/**
 * Ping server when a meta feeder has been unlocked.
 * Called directly by the file in question, when it is first loaded.
 * @param metaFeeder "[meta]-[index]"
 * @param url The file's actual window.location.href
 */
export async function syncUnlockedFile(metaFeeder:string, url:string) {
  if (!_syncDetails.canSync || !_syncDetails.teamName) {
    return;
  }
  const data = {
    eventName: _syncDetails.eventSync,
    player: _syncDetails.playerName,
    avatar: _syncDetails.emojiAvatar,
    team: _syncDetails.teamName,
    puzzle: metaFeeder,
    activity: EventSyncActivity.Unlock,
    data: url
  };

  await callSyncApi("PuzzlePing", data);
}

export async function sendRating(aspect: string, val: number) {
  if (!_syncDetails.canSync) {
    return;
  }
  const data = {
    eventName: _syncDetails.eventSync,
    player: _syncDetails.playerName || "",
    avatar: _syncDetails.emojiAvatar || "",
    team: _syncDetails.teamName || "",
    puzzle: puzzleTitleForSync(),
    activity: _syncDetails.mostProgress,
    data: `${aspect}:${val}`
  };

  await callSyncApi("RatePuzzle", data);
}

export async function sendFeedback(feedback: string) {
  if (!_syncDetails.canSync) {
    return;
  }
  const data = {
    eventName: _syncDetails.eventSync,
    player: _syncDetails.playerName || "",
    avatar: _syncDetails.emojiAvatar || "",
    team: _syncDetails.teamName || "",
    puzzle: puzzleTitleForSync(),
    activity: _syncDetails.mostProgress,
    data: feedback
  };

  await callSyncApi("GiveFeedback", data);
}
