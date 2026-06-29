
/***********************************************************
 * TABLEBUILDER.TS
 * Utilities for building pages with 2D tables
 *  - Constructs cells on the fly
 *  - Can use actual tables, or SVG
 * Should be called before other initializers, 
 * so the generated contents can trigger other behaviors.
 */

import { applyAllClasses } from "./classUtil";


export type TableDetails = {
  rootId: string;
  height?: number;  // number of rows, indexed [0..height)
  width?: number;   // number of columns, indexed [0..width)
  data?: string[];  // array of strings, where each string is one row and each character is one cell
                        // if set, height and width can be omitted, and derived from this array
  onRoot?: (root: HTMLElement|null) => undefined;  // if provided, callback once on the table root, before any rows or cells
  onRow?: (y: number) => HTMLElement|null;
  onCell: (val: string, x: number, y: number) => HTMLElement|null;
}

/**
 * Create a generic TR tag for each row in a table.
 * Available for TableDetails.onRow where that is all that's needed
 */
export function newTR(y:number) {
  return document.createElement('tr');
}

/**
 * Create a table from details
 * @param details A TableDetails, which can exist in several permutations with optional fields
 */
export function constructTable(details: TableDetails) {
  const root = document.getElementById(details.rootId);
  if (details.onRoot) {
    details.onRoot(root);
  }
  const height = (details.data) ? details.data.length : (details.height as number);
  for (let y = 0; y < height; y++) {
    let row = root;
    if (details.onRow) {
      const rr = details.onRow(y);
      if (!rr) {
        continue;
      }
      root?.appendChild(rr);
      row = rr;
    }
    
    const width = (details.data) ? details.data[y].length : (details.width as number);
    for (let x = 0; x < width; x++) {
      const val:string = (details.data) ? details.data[y][x] : '';
      const cc = details.onCell(val, x, y);
      if (cc) {
        row?.appendChild(cc);
      }
    }
  }
}

export const svg_xmlns = 'http://www.w3.org/2000/svg';
const html_xmlns = 'http://www.w3.org/2000/xmlns';

export function constructSvgTextCell(val:string, dx:number, dy:number, cls:string, stampable?:boolean) {
  if (val == ' ') {
    return null;
  }
  var vg = document.createElementNS(svg_xmlns, 'g');
  vg.classList.add('vertex-g');
  if (cls) {
    applyAllClasses(vg, cls);
  }
  vg.setAttributeNS('', 'transform', 'translate(' + dx + ', ' + dy + ')');
  var r = document.createElementNS(svg_xmlns, 'rect');
  r.classList.add('vertex');
  var t = document.createElementNS(svg_xmlns, 'text');
  t. appendChild(document.createTextNode(val));
  vg.appendChild(r);
  vg.appendChild(t);

  if (stampable) {
    var fog = document.createElementNS(svg_xmlns, 'g'); 
    fog.classList.add('fo-stampable');
    var fo = document.createElementNS(svg_xmlns, 'foreignObject');
    var fod = document.createElement('div');
    fod.setAttribute('xmlns', html_xmlns);
    fod.classList.add('stampable');

    fo.appendChild(fod);
    fog.appendChild(fo);
    vg.appendChild(fog);
  }
  return vg;
}

export function constructSvgImageCell(img:string, dx:number, dy:number, id?:string, cls?:string) {
  var vg = document.createElementNS(svg_xmlns, 'g');
  if (id) {
    vg.id = id;
  }
  vg.classList.add('vertex-g');
  if (cls) {
    applyAllClasses(vg, cls);
  }
  vg.setAttributeNS('', 'transform', 'translate(' + dx + ', ' + dy + ')');
  var r = document.createElementNS(svg_xmlns, 'rect');
  r.classList.add('vertex');
  var i = document.createElementNS(svg_xmlns, 'image');
  i.setAttributeNS('', 'href', img);
  vg.appendChild(r);
  vg.appendChild(i);
  return vg;
}

export function constructSvgStampable() {
  var fo = document.createElementNS(svg_xmlns, 'foreignObject');
  fo.classList.add('fo-stampable');
  var fod = document.createElement('div');
  fod.setAttribute('xmlns', html_xmlns);
  fod.classList.add('stampable');
  fo.appendChild(fod);
  return fo;
}