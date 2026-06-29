import { isIFrame } from "./boilerplate";
import { refillFromTemplate } from "./builderUse";
import { hasClass, toggleClass } from "./classUtil";
import { ContextError } from "./contextError";
import { loadMetaMaterials } from "./storage";

/**
 * Pass an array of all known meta materials.
 * Any that have not yet unlocked will be null.
 */
export type MetaSyncCallback = (data:object[]) => void;

export type MetaParams = {
  id: string,                  // The key to access stored materials
  up?: number,                 // The ID is a relative path. If there is an up step, how many?
  count: number,               // How many separate materials to check for
  onSync?: MetaSyncCallback,   // Function on the page to call when materials have changed
  refillClass?: string,        // Class of contains to refill when templates update
  refillTemplate?: string,     // ID of template to invoke for refill
};

type MetaInfo = MetaParams & {
  materials: object[],         // The set of materials loaded so far
};


let _metaInfo:MetaInfo;

/**
 * Setup meta sync on the named materials object
 * @param id The name of a materials object, shared between pages
 * @param count How many separate meta materials are possible. They will always be numbered [0..count)
 * @param callback The method on the page that will process the materials, whenever they update.
 */
export function setupMetaSync(param:MetaParams) {
  if (!param || isIFrame()) {
    return;  // Do nothing
  }
  const body:HTMLBodyElement = document.getElementsByTagName('body')[0] as HTMLBodyElement;
  if (!body) {
    throw new Error('Seting up meta sync requires a <body> tag');
  }
  _metaInfo = {
    id: param.id,
    count: param.count,
    onSync: param.onSync,
    refillClass: param.refillClass,
    refillTemplate: param.refillTemplate,
    materials: new Array(param.count).fill(null),
  };

  // Validate fields
  if (param.refillClass) {
    const refills = document.getElementsByClassName(param.refillClass);
    if (refills.length != param.count) {
      throw new ContextError('Refill class (' + param.refillClass + ') has ' + refills.length + ' instances, whereas ' + param.count + ' meta materials are expected.');
    }
    if (!param.refillTemplate) {
      throw new ContextError('MetaParam specified refillClass (' + param.refillClass + ') without also specifying refillTemplate.');
    }

    // All refill points start out as locked
    for (let i = 0; i < refills.length; i++) {
      toggleClass(refills[i], 'locked', true);
      toggleClass(refills[i], 'unlocked', false);
    }
  }
  else if (param.refillTemplate && !param.refillClass) {
    throw new ContextError('MetaParam specified refillTemplate (' + param.refillTemplate + ') without also specifying refillClass.');
  }
  else if (!param.onSync) {
    throw new ContextError('MetaParam expects either an onSync callback, or else both refill fields.');
  }

  // Refresh materials every time the user switches back to this page
  document.addEventListener('visibilitychange', function (event) {
    scanMetaMaterials();
  });
  body.addEventListener('focus', function (event) {
    scanMetaMaterials();
  });
  // Then run it now.
  scanMetaMaterials(true);
}

/**
 * Check for any updates to cached meta materials (from other pages).
 * If any changes, invoke the on-page callback.
 * @param force If set, always calls the onSync callback
 */
export function scanMetaMaterials(force?:boolean) {
  let changed = force || false;
  for (var i = 0; i < _metaInfo.count; i++) {
    if (_metaInfo.materials[i]) {
      continue;  // materials should never change. Either we have them or we don't.
    }
    var materials = loadMetaMaterials(_metaInfo.id, _metaInfo.up || 0, i);
    if (materials) {
      _metaInfo.materials[i] = materials;
      changed = true;
    }
  }
  if (loadMetaMaterials(_metaInfo.id, _metaInfo.up || 0, _metaInfo.count)) {
    throw new ContextError('WARNING: Meta materials may be misnumbered. Expected #0 - #' + (_metaInfo.count - 1) + ' but found #' + _metaInfo.count);
  }

  if (changed) {
    if (_metaInfo.onSync) {
      _metaInfo.onSync(_metaInfo.materials);
    }
    if (_metaInfo.refillClass) {
      refillFromMeta(_metaInfo.materials)
    }
  }
}

/**
 * Refill a collection of containers on the page with the latest meta materials.
 * The data is formatted using a named template.
 * @param materials The latest meta materials
 */
function refillFromMeta(materials:object[]) {
  const containers = document.getElementsByClassName(_metaInfo.refillClass as string);
  for (var i = 0; i < containers.length; i++) {
    if (materials[i]) {
      var container = containers[i];
      if (!hasClass(container, 'unlocked')) {
        refillFromTemplate(container, _metaInfo.refillTemplate as string, materials[i]);
        toggleClass(container, 'locked', false);
        toggleClass(container, 'unlocked', true);
      }
    }
  }
}
