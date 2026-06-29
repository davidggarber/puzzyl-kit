import { evaluateFormula, valueFromGlobalContext, theBoilerContext } from "./builderContext";
import { findParentOfClass, getOptionalComplex, getOptionalStyle, hasClass, toggleClass } from "./classUtil";
import { StampToolDetails } from "./stampTools";

/**
 * Validate the paint-by-numbers grid that contains this cell
 * @param target The cell that was just modified
 */
function validatePBN(target:HTMLElement) {
  const table = findParentOfClass(target, 'paint-by-numbers');
  if (!table) {
    return;
  }
  const stampList = getOptionalStyle(table, 'data-stamp-list');
  if (stampList) {
    validateColorPBN(target, table as HTMLElement, stampList);
    return;
  }

  let pos = target.id.split('_');
  const row = parseInt(pos[0]);
  const col = parseInt(pos[1]);
  const rSum = document.getElementById('rowSummary-' + row);
  const cSum = document.getElementById('colSummary-' + col);

  if (!rSum && !cSum) {
    return;  // this PBN does not have a UI for validation
  }

  // Scan all cells in this PBN table, looking for those in the current row & column
  // Track the painted ones as a list of row/column indices
  const cells = table.getElementsByClassName('stampable');
  const rowOn:number[] = [];
  const colOn:number[] = [];
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (hasClass(cell, 'stampPaint')) {
      pos = cell.id.split('_');
      const r = parseInt(pos[0]);
      const c = parseInt(pos[1]);
      if (r == row) {
        rowOn.push(c);
      }
      if (c == col) {
        colOn.push(r);
      }
    }
  }

  const rows = contextDataFromRef(table, 'data-row-context');
  if (rSum && rows) {
    // Convert a list of column indices to group notation
    const groups = summarizePBN(rowOn);
    rSum.innerHTML = '';
    for (const g of groups) {
      if (g > 0) {
        const span = document.createElement('span');
        toggleClass(span, 'pbn-row-group', true);
        span.innerText = g.toString();
        rSum.appendChild(span);
      }
    }
    const header = rows[row];
    const comp = compareGroupsPBN(header, groups);
    toggleClass(rSum, 'done', comp == 0);
    toggleClass(rSum, 'exceeded', comp > 0);
    const rHead = document.getElementById('rowHeader-' + row);
    toggleClass(rHead, 'done', comp == 0);
  }

  const cols = contextDataFromRef(table, 'data-col-context');
  if (cSum) {
    const groups = summarizePBN(colOn);
    cSum.innerHTML = '';
    for (const g of groups) {
      if (g > 0) {
        const span = document.createElement('span');
        toggleClass(span, 'pbn-col-group', true);
        span.innerText = g.toString();
        cSum.appendChild(span);
      }
    }
    const header = cols[col];
    const comp = compareGroupsPBN(header, groups);
    toggleClass(cSum, 'done', comp == 0);
    toggleClass(cSum, 'exceeded', comp > 0);
    const cHead = document.getElementById('colHeader-' + col);
    toggleClass(cHead, 'done', comp == 0);
  }

}

/**
 * Is a given cell tagged with a (non-blank) stamp id?
 * @param cell 
 * @param stampTools 
 * @returns the stamp data, or undefined if none found
 */
function dataFromTool(cell:HTMLElement, stampTools: StampToolDetails[]): string|undefined {
  for (let i = 0; i < stampTools.length; i++) {
    if (stampTools[i].data && hasClass(cell, stampTools[i].id))
      return stampTools[i].data;
  }
  return undefined;
}

/**
 * Look up a value, according to the context path cached in an attribute
 * @param elmt Any element
 * @param attr An attribute name, which should exist in elmt or any parent
 * @returns Any JSON object, or undefined if not found (or found an empty string)
 */
function contextDataFromRef(elmt:Element, attr:string):any {
  const data = getOptionalComplex(elmt, attr);
  return data ? data : undefined;
}

/**
 * Read the user's actual painting within the PBN grid as a list of group sizes.
 * @param list A list of numbers, indicating row or column indices
 * @returns A list of groups separated by gaps. Positive numbers are consecutive painted. Negative are consecutive un-painted.
 * The leading- and trailing- empty cells are ignored. But if the whole series is empty, return [0]
 */
function summarizePBN(list:number[]):number[] {
  let prev = NaN;
  let consec = 0;
  const summary:number[] = [];
  list.push(NaN);
  for (const next of list) {
    if (next == prev + 1) {
      consec++;
    }
    else {
      if (consec > 0) {
        summary.push(consec);
        const gap = next - prev - 1;
        if (!isNaN(gap) && gap > 0) {
          summary.push(-gap);
        }
      }
      consec = (!isNaN(next)) ? 1 : 0;
    }
    prev = next;
  }
  if (summary.length == 0) {
    return [0];
  }
  return summary;
}

/**
 * Compare the actual panted cells vs. the clues.
 * The actual cells could indicate either more than was clued, or less than was clued, or exactly what was clued.
 * @param expect A list of expected groups (positives only)
 * @param have A list of actual groups (positives indicate groups, negatives indicates gaps between groups)
 * @returns 0 if exact, 1 if actual exceeds expected, or -1 if actual is not yet expected, but hasn't contradicted it yet
 */
function compareGroupsPBN(expect:number[], have:number[]) {
  let exact = true;
  let e = 0;
  let gap = 0;
  let prevH = 0;
  let curE = expect.length > 0 ? expect[0] : 0;
  for (const h of have) {
    if (h <= 0) {
      gap = -h;
      continue;
    }
    prevH = prevH > 0 ? (prevH + gap + h) : h;
    if (prevH <= curE) {
      exact = exact && h == curE;
      gap = 0;
      if (prevH == curE) {
        prevH = 0;
        e++;
        curE = e < expect.length ? expect[e] : 0;
      }
    }
    else {
      exact = false;
      prevH = 0;
      gap = 0;
      e++;
      while (e < expect.length && h > expect[e]) {
        e++;
      }
      curE = e < expect.length ? expect[e] : 0;
      if (h < curE) {
        prevH = h;
      }
      else if (h == curE) {
        e++;
        curE = e < expect.length ? expect[e] : 0;
      }
      else {
        return 1;  // too big
      }
    }
  }
  // return 0 for exact match
  // return -1 for incomplete match - groups thus far do not exceed expected
  return (exact && e == expect.length) ? 0 : -1;
}

/**
 * When a PBN group in row or col header is checked,
 * toggle a check- or cross-off effect.
 * @param group The group that was clicked.
 */
function togglePbnClue(group:HTMLSpanElement) {
  toggleClass(group, 'pbn-check');
}

type indexTag = {
  index: number,
  tag: string
}

const nonIndexTag:indexTag = {index:NaN, tag: ''};

type linearTag = {
  len: number,
  tag: string
}

const nonLinearTag:linearTag = {len: 0, tag: ''};
const outerGapTag:linearTag = {len: 1, tag: ''};

/**
* Validate the paint-by-numbers grid that contains this cell
* @param target The cell that was just modified
* @param table The containing table
* @param stampList
*/
function validateColorPBN(target:HTMLElement, table:HTMLElement, stampList:string) {
  const stampTools = valueFromGlobalContext(stampList) as StampToolDetails[];

  let pos = target.id.split('_');
  const row = parseInt(pos[0]);
  const col = parseInt(pos[1]);
  const rSum = document.getElementById('rowSummary-' + row);
  const cSum = document.getElementById('colSummary-' + col);

  if (!rSum && !cSum) {
    return;  // this PBN does not have a UI for validation
  }

  // Scan all cells in this PBN table, looking for those in the current row & column
  // Track the painted ones as a list of row/column indices
  const cells = table.getElementsByClassName('stampable');
  const rowOn:indexTag[] = [];
  const colOn:indexTag[] = [];
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const data = dataFromTool(cell as HTMLElement, stampTools);
    if (data) {
      pos = cell.id.split('_');
      const r = parseInt(pos[0]);
      const c = parseInt(pos[1]);
      if (r == row) {
        const it:indexTag = {index:c, tag:data};
        rowOn.push(it);
      }
      if (c == col) {
        const it:indexTag = {index:r, tag:data};
        colOn.push(it);
      }
    }
  }

  const rows = contextDataFromRef(table, 'data-row-context');
  if (rSum && rows) {
    // Convert a list of column indices to group notation
    const groups = summarizeTaggedPBN(rowOn);
    rSum.innerHTML = '';
    for (const g of groups) {
      if (g.tag != '') {
        const span = document.createElement('span');
        toggleClass(span, 'pbn-row-group', true);
        toggleClass(span, 'pbn-color-' + g.tag, true);
        span.innerText = g.len.toString();
        rSum.appendChild(span);
      }
    }
    const header = invertColorTags(rows[row]);
    const comp = compareTaggedGroupsPBN(header, groups);
    toggleClass(rSum, 'done', comp == 0);
    toggleClass(rSum, 'exceeded', comp > 0);
    const rHead = document.getElementById('rowHeader-' + row);
    toggleClass(rHead, 'done', comp == 0);
  }

  const cols = contextDataFromRef(table, 'data-col-context');
  if (cSum) {
    const groups = summarizeTaggedPBN(colOn);
    cSum.innerHTML = '';
    for (const g of groups) {
      if (g.tag != '') {
        const span = document.createElement('span');
        toggleClass(span, 'pbn-col-group', true);
        toggleClass(span, 'pbn-color-' + g.tag, true);
        span.innerText = g.len.toString();
        cSum.appendChild(span);
      }
    }
    const header = invertColorTags(cols[col]);
    const comp = compareTaggedGroupsPBN(header, groups);
    toggleClass(cSum, 'done', comp == 0);
    toggleClass(cSum, 'exceeded', comp > 0);
    const cHead = document.getElementById('colHeader-' + col);
    toggleClass(cHead, 'done', comp == 0);
  }

}

/**
* Starting from a tag-clumped header input:
*  [ {tag1:[1,2]}, {tag2:[3,4]} ]
* Convert to linear groups with tags
*  [ [1,tag1], [2,tag1], [3,tag2], [4,tag2]]
* @param header input-style header
* @returns linear-style header
*/
function invertColorTags(header:Record<string, number[]>[]): linearTag[] {
  const linear:linearTag[] = [];
  for (let i = 0; i < header.length; i++) {
    const tagged = header[i];  // {tag:[1,2]}
    const tag = Object.keys(tagged)[0];
    const groups = tagged[tag] as number[];
    for (let g = 0; g < groups.length; g++) {
      const lt:linearTag = {len:groups[g], tag:tag};
      linear.push(lt);
    }
  }
  return linear;
}

/**
 * Read the user's actual painting within the PBN grid as a list of group sizes.
 * @param list A list of numbers, indicating row or column indices
 * @returns A list of groups and gaps, trimming exterior gaps.
 */
function summarizeTaggedPBN(list:indexTag[]): linearTag[] {
  let prev = nonIndexTag;
  let consec = 0;
  const summary:linearTag[] = [];
  list.push(nonIndexTag);
  for (const next of list) {
    if (next.tag == prev.tag && next.index == prev.index + 1) {
      consec++;
    }
    else {
      if (consec > 0) {
        const line:linearTag = {len: consec, tag:prev.tag}
        summary.push(line);
        const gap:linearTag = {len: next.index - prev.index - 1, tag:''};
        if (next.tag != '') {
          summary.push(gap);
        }
      }
      consec = next == nonIndexTag ? 0 : 1;
    }
    prev = next;
  }
  if (summary.length == 0) {
    return [];
  }
  return summary;
}

/**
 * Compare the actual painted cells vs. the clues.
 * The actual cells could indicate either more than was clued, or less than was clued, or exactly what was clued.
 * @param expect A list of expected groups (omitting gaps)
 * @param have A list of actual groups (including gaps between groups)
 * @returns 0 if exact, 1 if actual exceeds expected, or -1 if actual is not yet expected, but hasn't contradicted it yet
 */
function compareTaggedGroupsPBN(expect:linearTag[], have:linearTag[]) {
  let exact = true;
  let e = 0;
  let gap = outerGapTag;
  let prevH = nonLinearTag;
  let curE = expect.length == 0 ? nonLinearTag : expect[0];
  for (const h of have) {
    if (h.tag == '') {
      gap = h;
      continue;
    }
    
    if (h.tag == prevH.tag) {
      // Two groups of the same type, separated by a gap, could fit within a single expected range
      prevH.len += gap.len + h.len;
      if (prevH.len <= curE.len) {        
        continue;
      }
      // curE has already accomodated prevH. If this new, bigger prevH doesn't fit, move on to the next E, and forget prevH
      e++;
    }

    // If the next expected group is either a different type, or too small, fast forward to one that fits
    while (e < expect.length && (expect[e].tag != h.tag || expect[e].len < h.len)) {
      exact = false;
      e++;
    }
    if (e >= expect.length) {
      return 1;  // We're past the end, while still having cells that don't fit
    }
    if (h.len == curE.len) {
      e++;
      prevH = nonLinearTag;
    } else {
      exact = false;
      prevH = h;
    }
    curE = expect[e];
  }
  // return 0 for exact match
  // return -1 for incomplete match - groups thus far do not exceed expected
  return (exact && e == expect.length) ? 0 : -1;
}