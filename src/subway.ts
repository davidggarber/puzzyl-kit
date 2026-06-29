
/**
 * On page load, look for any instances of elements tag with class names we respond to.
 * When found, expand those elements appropriately.
 */
export function setupSubways() {
  const subways = document.getElementsByClassName('subway');
  for (let i = 0; i < subways.length; i++) {
      createSubway(subways[i] as HTMLElement);
  }
}

/**
 * Maximum of two numbers, or the second, if current is null
 * @param val A new value
 * @param curr The current max value, which can be null
 * @returns The max
 */
function maxx(val:number, curr?:number):number {
  return (!curr || curr < val) ? val : curr;
}
/**
 * Minimum of two numbers, or the second, if current is null
 * @param val A new value
 * @param curr The current min value, which can be null
 * @returns The min
 */
function minn(val:number, curr?:number):number {
  return (!curr || curr > val) ? val : curr;
}

function bounding(pt:DOMPoint, rect?:DOMRect) :DOMRect {
  if (!rect) {
      return  new DOMRect(pt.x, pt.y, 0, 0);
  }
  const left = minn(rect.left, pt.x);
  const right = maxx(rect.right, pt.x);
  const top = minn(rect.top, pt.y);
  const bottom = maxx(rect.bottom, pt.y);
  return new DOMRect(left, top, right - left, bottom - top);
}

/**
 * Round a value to the nearest 0.1
 * @param n Any number
 * @returns A number with no significant digits smaller than a tenth
 */
function dec(n:number) {
  return Math.round(n * 10) / 10;
}

type SubwayPath = {
  origin:DOMRect;
  path_d:string;
  bounds:DOMRect;
  shift:DOMPoint;
}

/**
 * Create an SVG inside a <div class='subway'>, to connect input cells.
 * @param subway 
 */
function createSubway(subway:HTMLElement) {
  let details = verticalSubway(subway);
  if (!details) {
    details = horizontalSubway(subway);
  }
  if (details) {
    const xmlns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(xmlns, 'svg');
    const path = document.createElementNS(xmlns, 'path');

    path.setAttributeNS(null, 'd', details.path_d);
    svg.appendChild(path);
    svg.setAttributeNS(null, 'width', dec(details.bounds.right - details.origin.x - details.shift.x + 2) + 'px');
    svg.setAttributeNS(null, 'height', dec(details.bounds.bottom - details.origin.y - details.shift.y + 2) + 'px');
    subway.appendChild(svg);
  
    if (details.shift.x != 0) {
        subway.style.left = dec(details.shift.x) + 'px';
    }
    if (details.shift.y != 0) {
      subway.style.top = dec(details.shift.y) + 'px';
  }

  }
}

/**
 * Build the paths of a vertically-oriented subway
 * @param subway The <div class='subway' with coordinate info
 * @returns Details for the SVG and PATH to be created, or undefined if the div does not indicate vertical
 */
function verticalSubway(subway:HTMLElement) :SubwayPath|undefined {
  const origin = subway.getBoundingClientRect();
  let sLefts:string = subway.getAttributeNS('', 'data-left-end') || '';
  let sRights:string = subway.getAttributeNS('', 'data-right-end') || '';
  if (sLefts.length == 0 && sRights.length == 0) {
    return undefined;
  }

  const leftId:string|null = subway.getAttributeNS('', 'data-left-id');
  const rightId:string|null = subway.getAttributeNS('', 'data-right-id');
  sLefts = joinIds(leftId, sLefts);
  sRights = joinIds(rightId, sRights);

  let bounds:DOMRect|undefined;
  const yLefts:number[] = [];
  const yRights:number[] = [];

  // right-side spurs
  const rights = sRights.split(' ');
  for (let i = 0; i < rights.length; i++) {
      const pt = getAnchor(rights[i], 'left');
      bounds = bounding(pt, bounds);
      yRights.push(dec(pt.y - origin.top));
  }

  // left-side spurs
  const lefts = sLefts.split(' ');
  for (let i = 0; i < lefts.length; i++) {
      const pt = getAnchor(lefts[i], 'right');
      bounds = bounding(pt, bounds);
      yLefts.push(dec(pt.y - origin.top));
  }

  if (!bounds) {
    return;  // ERROR
  }
  // rationalize the boundaries
  const shift_left = minn(0, bounds.left - origin.left);
  const left = maxx(0, dec(bounds.left - origin.left - shift_left));
  const right = dec(bounds.left + bounds.width - origin.left - shift_left);

  // belatedly calculate the middle
  const sMiddle = subway.getAttributeNS('', 'data-center-line');
  let middle:number;
  if (!sMiddle) {
    middle = bounds.width / 2;
  }
  else if (sMiddle.indexOf('%') == sMiddle.length - 1) {
      middle = dec(parseInt(sMiddle) * bounds.width / 100);
  }
  else {
      middle = parseInt(sMiddle);
  }
  
  let d = '';
  if (bounds.height <= 2.5 && yLefts.length == 1 && yRights.length == 1) {
    d = 'M' + left + ',' + yLefts[0]
      + ' L' + right + yRights[0];
  }
  else {
    // Draw the first left to the last right
    let d = 'M' + left + ',' + yLefts[0] 
        + ' L' + middle + ',' + yLefts[0]
        + ' L' + middle + ',' + yRights[yRights.length - 1]
        + ' L' + right + ',' + yRights[yRights.length - 1];
    if (yLefts.length > 0 || yRights.length > 0) {
        // Draw the last left to the first right
        d += 'M' + left + ',' + yLefts[yLefts.length - 1] 
            + ' L' + middle + ',' + yLefts[yLefts.length - 1]
            + ' L' + middle + ',' + yRights[0]
            + ' L' + right + ',' + yRights[0];
    }
    // Add any middle spurs
    for (let i = 1; i < yLefts.length - 1; i++) {
        d += 'M' + left + ',' + yLefts[i] 
            + ' L' + middle + ',' + yLefts[i]
            + ' L' + middle + ',' + yRights[0];
    }
    for (let i = 1; i < yRights.length - 1; i++) {
        d += 'M' + right + ',' + yRights[i] 
            + ' L' + middle + ',' + yRights[i]
            + ' L' + middle + ',' + yLefts[0];
    }
  }

  return {
    origin: origin,
    path_d: d,
    bounds: bounds,
    shift: new DOMPoint(shift_left, 0)
  } as SubwayPath;
}

function joinIds(id:string|null, indeces:string) :string {
  if (!id || !indeces) {
    return indeces;
  }
  const list = indeces.split(' ').map(i => id + '.' + i);
  return list.join(' ');
}

/**
 * Build the paths of a horizontally-oriented subway
 * @param subway The <div class='subway' with coordinate info
 * @returns Details for the SVG and PATH to be created, or undefined if the div does not indicate horizontal
 */
function horizontalSubway(subway:HTMLElement) :SubwayPath|undefined {
  const origin = subway.getBoundingClientRect();
  let sTops:string = subway.getAttributeNS('', 'data-top-end') || '';
  let sBottoms:string = subway.getAttributeNS('', 'data-bottom-end') || '';
  if (sTops.length == 0 && sBottoms.length == 0) {
    return undefined;
  }

  const topId:string|null = subway.getAttributeNS('', 'data-top-id');
  const bottomId:string|null = subway.getAttributeNS('', 'data-bottom-id');
  sTops = joinIds(topId, sTops);
  sBottoms = joinIds(bottomId, sBottoms);

  let bounds:DOMRect|undefined;
  const xTops:number[] = [];
  const xBottoms:number[] = [];

  // top-side spurs
  if (sBottoms.length > 0) {
    const bottoms = sBottoms.split(' ');
    for (let i = 0; i < bottoms.length; i++) {
        const pt = getAnchor(bottoms[i], 'top');
        bounds = bounding(pt, bounds);
        xBottoms.push(dec(pt.x - origin.left));
    }  
  }

  // bottom-side spurs
  if (sTops.length > 0) {
    const tops = sTops.split(' ');
    for (let i = 0; i < tops.length; i++) {
        const pt = getAnchor(tops[i], 'bottom');
        bounds = bounding(pt, bounds);
        xTops.push(dec(pt.x - origin.left));
    }  
  }

  if (!bounds) {
    return;  // ERROR
  }

  // belatedly calculate the middle
  const sMiddle = subway.getAttributeNS('', 'data-center-line');
  let middle:number;
  if (!sMiddle) {
    middle = bounds.height / 2;
  }
  else if (sMiddle.indexOf('%') == sMiddle.length - 1) {
      middle = dec(parseInt(sMiddle) * bounds.height / 100);
  }
  else {
      middle = parseInt(sMiddle);
      if (bounds.height <= middle) {
        if (xTops.length == 0) {
          bounds.y -= middle + 1;
        }
        bounds.height = middle + 1;
      }
  }
  
  // align the boundaries
  const shift_top = minn(0, bounds.top - origin.top);  // zero or negative
  const top = maxx(0, dec(bounds.top - origin.top - shift_top));
  const bottom = dec(bounds.top + bounds.height - origin.top - shift_top);
  
  let d = '';
  if (bounds.width <= 2.5 && xTops.length == 1 && xBottoms.length == 1) {
    // Special case (nearly) vertical connectors
    d = 'M' + xTops[0] + ',' + top  
      + ' L' + xBottoms[0] + ',' + bottom;
  }
  else {
    // Draw the horizontal bar
    d = 'M' + dec(bounds.left - origin.left) + ',' + middle
      + ' h' + dec(bounds.width);
    // Draw all up-facing spurs
    for (let i = 0; i < xTops.length; i++) {
        d += ' M' + xTops[i] + ',' + middle
          + ' v' + -middle;
    }
    // Draw all down-facing spurs
    for (let i = 0; i < xBottoms.length; i++) {
        d += ' M' + xBottoms[i] + ',' + middle
          + ' v' + dec(bounds.height - middle);
    }
  }

  return {
    origin: origin,
    path_d: d,
    bounds: bounds,
    shift: new DOMPoint(0, shift_top)
  } as SubwayPath;
}

/**
 * Find a point on the perimeter of a specific subway cell
 * @param id_index A cell identity in the form "col1.4", where col1 is a letter-cell-block and .4 is the 4th cell in that block
 * @param edge One of {left|right|top|bottom}. The point is the midpoint of that edge of the cell
 * @returns A point on the page in client coordinates
 */
function getAnchor(id_index:string, edge:string):DOMPoint {
  const idx = id_index.split('.');
  let elmt = document.getElementById(idx[0]) as HTMLElement;
  if (idx.length > 1) {
      const children = elmt.getElementsByClassName('letter-cell');
      elmt = children[parseInt(idx[1]) - 1] as HTMLElement;  // indexes start at 1
  }
  const rect = elmt.getBoundingClientRect();
  if (edge == 'left') {
      return new DOMPoint(rect.left, rect.top + 1 + rect.height / 2);
  }
  if (edge == 'right') {
      return new DOMPoint(rect.right, rect.top - 1 + rect.height / 2);
  }
  if (edge == 'top') {
      return new DOMPoint(rect.left + 1 + rect.width / 2, rect.top);
  }
  if (edge == 'bottom') {
      return new DOMPoint(rect.left - 1 + rect.width / 2, rect.bottom);
  }
  // error: return middle
  return new DOMPoint(rect.left - 1 + rect.width / 2, rect.top - 1 + rect.height / 2);
}