/**
 * Pass an array of all known meta materials.
 * Any that have not yet unlocked will be null.
 */
export type MetaSyncCallback = (data: object[]) => void;
export type MetaParams = {
    id: string;
    up?: number;
    count: number;
    onSync?: MetaSyncCallback;
    refillClass?: string;
    refillTemplate?: string;
};
/**
 * Setup meta sync on the named materials object
 * @param id The name of a materials object, shared between pages
 * @param count How many separate meta materials are possible. They will always be numbered [0..count)
 * @param callback The method on the page that will process the materials, whenever they update.
 */
export declare function setupMetaSync(param: MetaParams): void;
/**
 * Check for any updates to cached meta materials (from other pages).
 * If any changes, invoke the on-page callback.
 * @param force If set, always calls the onSync callback
 */
export declare function scanMetaMaterials(force?: boolean): void;
