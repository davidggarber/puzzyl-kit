import { linkCss } from "./boilerplate";
import { validateInputReady } from "./confirmation";
import { ContextError } from "./contextError";
import { eventRelStamp, getSafariDetails } from "./events";

/**
 * Find a template that matches an ID.
 * Could be on the local page, or a built-in one
 * @param tempId The ID of the template (must be valid)
 * @returns An HTMLTemplateElement, or throws
 */
export function getTemplate(tempId:string) :HTMLTemplateElement {
  if (tempId) {
    let elmt = document.getElementById(tempId);
    if (elmt) {
      return elmt as HTMLTemplateElement;
    }
    const template = builtInTemplate(tempId);
    if (template) {
      return template;
    }
  }
  throw new ContextError('Template not found: ' + tempId);
}

/**
 * Any method that creates <template> nodes
 */
type TemplateBuilder = () => HTMLTemplateElement;

/**
 * Map template names to methods than can generate that template.
 */
const builtInTemplates: {[key: string]: TemplateBuilder}  = {
  paintByNumbers: paintByNumbersTemplate,
  paintByColorNumbers: paintByColorNumbersTemplate,
  classStampPalette: classStampPaletteTemplate,
  classStampNoTools: classStampNoToolsTemplate,
  finalAnswer: finalAnswerTemplate,
  extractedCopiableSpan: extractedCopiableSpanTemplate,
  extractedCopiablePattern: extractedCopiablePatternTemplate,
  copiablePattern: copiablePatternTemplate,
}

/**
 * Match a template name to a built-in template object
 * @param tempId The ID
 * @returns A template element (not part of the document), or undefined if unrecognized.
 */
export function builtInTemplate(tempId:string) :HTMLTemplateElement|undefined {
  if (tempId in builtInTemplates) {
    return builtInTemplates[tempId]();
  }
};

/**
 * Tag a template for default argument values.
 * Each key+value will become an attribute named 'data-'+key.
 * @param temp A newly constructed template element.
 * @param dict A dictionary of attribute names -> default values
 */
function setDefaultsTemplateArgs(temp:HTMLTemplateElement, dict:object) {
  for (const [key, value] of Object.entries(dict)) {
    temp.setAttribute('default-'+key, value);
  }
}

/**
 * Create a standard pant-by-numbers template element.
 * Also load the accompanying CSS file.
 * @returns The template.
 */
function paintByNumbersTemplate() :HTMLTemplateElement {
  linkCss(getSafariDetails().cssRoot + 'PaintByNumbers.css');

  const temp = document.createElement('template');
  temp.id = 'paintByNumbers';
  temp.innerHTML = 
  `<ttable class="paint-by-numbers stampable-container stamp-drag bolden_5 bolden_10" data-col-context="{cols$}" data-row-context="{rows$}">
    <tthead>
      <ttr class="pbn-col-headers">
        <tth class="pbn-corner">
          <span class="pbn-instructions">
            This is a nonogram<br />(aka paint-by-numbers).<br />
            For instructions, see 
            <a href="https://help.puzzyl.net/PBN" target="_blank">
              https://help.puzzyl.net/PBN<br />
              <img src="$eventRelImage('Intro/pbn.png')" />
            </a>
          </span>
        </tth>
        <for each="col" in="{colGroups}">
          <ttd id="colHeader-{col#}" class="pbn-col-header">
            <for each="group" in="{col}"><span class="pbn-col-group" onclick="togglePbnClue(this)">{group}</span></for>
          </ttd>
        </for>
        <tth class="pbn-row-footer pbn-corner">&#xa0;</tth>
      </ttr>
    </tthead>
    <for each="row" in="{rowGroups}">
      <ttr class="pbn-row">
        <ttd id="rowHeader-{row#}" class="pbn-row-header">
          &#x200a; <for each="group" in="{row}"><span class="pbn-row-group" onclick="togglePbnClue(this)">{group}</span> </for>&#x200a;
        </ttd>
        <for each="col" in="{colGroups}">
          <ttd id="{row#}_{col#}" class="pbn-cell stampable">&times;</ttd>
        </for>
        <ttd class="pbn-row-footer"><span id="rowSummary-{row#}" class="pbn-row-validation"></span></ttd>
      </ttr>
    </for>
    <ttfoot>
      <ttr class="pbn-col-footer">
        <tth class="pbn-corner">&#xa0;</tth>
        <for each="col" in="{colGroups}">
          <ttd class="pbn-col-footer"><span id="colSummary-{col#}" class="pbn-col-validation"></span></ttd>
        </for>
        <tth class="pbn-corner-validation">
          êœ›&#xa0;&#xa0;&#xa0;&#xa0;êœ›&#xa0;&#xa0;&#xa0;&#xa0;êœ›
          <br />←&#xa0;validation</tth>
      </ttr>
    </ttfoot>
  </ttable>`;
  return temp;
}

/**
 * Create a standard paint-by-numbers template element.
 * Also load the accompanying CSS file.
 * @returns The template.
 */
function paintByColorNumbersTemplate() :HTMLTemplateElement {
  linkCss(getSafariDetails().cssRoot + 'PaintByNumbers.css');

  const temp = document.createElement('template');
  temp.id = 'paintByNumbers';
  temp.innerHTML = 
  `<ttable class="paint-by-numbers stampable-container stamp-drag pbn-two-color {?styles}" data-col-context="{cols$}" data-row-context="{rows$}" data-stamp-list="{stamplist}">
    <tthead>
      <ttr class="pbn-col-headers">
        <tth class="pbn-corner">
          <span class="pbn-instructions">
            This is a nonogram<br />(aka paint-by-numbers).<br />
            For instructions, see 
            <a href="https://help.puzzyl.net/PBN" target="_blank">
              https://help.puzzyl.net/PBN<br />
              <img src="https://help.puzzyl.net/pbn.png" />
            </a>
          </span>
        </tth>
        <for each="col" in="{colGroups}">
          <ttd id="colHeader-{col#}" class="pbn-col-header">
            <for each="colorGroup" in="{col}"><for key="color" in="{colorGroup}"><for each="group" in="{color!}"><span class="pbn-col-group pbn-color-{color}" onclick="togglePbnClue(this)">{group}</span></for></for></for>
          </ttd>
        </for>
        <if test="?validate" ne="false">
          <tth class="pbn-row-footer pbn-corner">&#xa0;</tth>
        </if>
      </ttr>
    </tthead>
      <for each="row" in="{rowGroups}">
        <ttr class="pbn-row">
          <ttd id="rowHeader-{row#}" class="pbn-row-header">
            &#x200a; 
            <for each="colorGroup" in="{row}"><for key="color" in="{colorGroup}">
              <for each="group" in="{color!}"><span class="pbn-row-group pbn-color-{color}" onclick="togglePbnClue(this)">{group}</span> </for>
            &#x200a;</for></for>
          </ttd>
          <for each="col" in="{colGroups}">
          <ttd id="{row#}_{col#}" class="pbn-cell stampable">{?blank}</ttd>
        </for>
        <if test="?validate" ne="false">
          <ttd class="pbn-row-footer"><span id="rowSummary-{row#}" class="pbn-row-validation"></span></ttd>
        </if>
      </ttr>
    </for>
    <if test="?validate" ne="false">
      <ttfoot>
        <ttr class="pbn-col-footer">
          <tth class="pbn-corner">&#xa0;</tth>
          <for each="col" in="{colGroups}">
            <ttd class="pbn-col-footer"><span id="colSummary-{col#}" class="pbn-col-validation"></span></ttd>
          </for>
          <tth class="pbn-corner-validation">
            êœ›&#xa0;&#xa0;&#xa0;&#xa0;êœ›&#xa0;&#xa0;&#xa0;&#xa0;êœ›
            <br />←&#xa0;validation</tth>
        </ttr>
      </ttfoot>
    </if>
  </ttable>`;
  return temp;
}

/**
 * Create a standard paint-by-numbers template element.
 * Also load the accompanying CSS file.
 * @returns The template.
 * @remarks This template takes the following arguments:
 *   size: Optional descriptor of stamp toolbar button size.
 *         Choices are "medium" and "small". The default is large.
 *   erase: the tool id of the eraser
 *   tools: A list of objects, each of which contain:
 *     id: the name of the stamp.
 *     next: Optional id of the next stamp, for rotational clicking.
 *           If absent, clicking on pre-stamped cells does nothing differnt.
 *     modifier: Optional shift state for clicks. 
 *               Choices are "ctrl", "alt", "shift".
 *     img: The image source path to the button.
 *     label: Optional text to render below the toolbar button
 * @remarks Invoking this stamping template also loads the PaintByNumbers.css
 * Top candidates of styles to override include:
 *   stampLabel: to change or suppress the display of the label.
 *   stampMod: to change of suppress the modifier as a simple label.
 */
function classStampPaletteTemplate() :HTMLTemplateElement {
  linkCss(getSafariDetails().cssRoot + 'PaintByNumbers.css');

  const temp = document.createElement('template');
  temp.id = 'classStampPalette';
  temp.innerHTML = 
  `<div id="stampPalette" data-tool-count="3" data-tool-erase="{erase}">
    <for each="tool" in="{tools}">
      <div id="{tool.id}" class="stampTool {?size}" data-stamp-id="{tool.id}" data-style="{tool.id}" data-click-modifier="{tool?modifier}" title="{tool?modifier} + draw" data-next-stamp-id="{tool.next}">
        <div class="roundTool {tool.id}-button">
          <span id="{tool.id}-icon" class="stampIcon"><img src_="{tool.img}" /></span>
          <span id="{tool.id}-label" class="stampLabel">{tool?label}</span>
          <span id="{tool.id}-mod" class="stampMod">{tool?modifier}+click</span>
        </div>
      </div>
    </for>
  </div>`;
  return temp;
}

function classStampNoToolsTemplate() :HTMLTemplateElement {
  linkCss(getSafariDetails().cssRoot + 'PaintByNumbers.css');

  const temp = document.createElement('template');
  temp.id = 'classStampPalette';
  temp.innerHTML = 
  `<div id="stampPalette" class="hidden" data-tool-erase="{erase}">
    <for each="tool" in="{tools}">
      <div class="stampTool" id="{tool.id}" data-next-stamp-id="{tool.next}" data-style="{tool.id}">
      </div>
    </for>
  </div>`;
  return temp;
}

function stampPaletteTemplate() :HTMLTemplateElement {
  linkCss(getSafariDetails().cssRoot + 'StampTools.css');

  const temp = document.createElement('template');
  temp.innerHTML = 
  `<ttable class="paint-by-numbers bolden_5 bolden_10" data-col-context="{cols$}" data-row-context="{rows$}">
  </ttable>`;
  return temp;
}

/**
 * Invoke via <use template='finalAnswer' left='L' bottom='B' width='w' />
 * where L and B are the absolute position of the div, and W is the width of the word input.
 * If omitted, the defaults are:
 *  - left = "2in"
 *  - bottom = "0px"
 *  - width = "3in"
 * @returns A template element
 */
function finalAnswerTemplate() :HTMLTemplateElement {
  const temp = document.createElement('template');
  setDefaultsTemplateArgs(temp, {
    left:'2in',
    bottom:'-60px',
    width:'3in'
  });
  temp.innerHTML = 
    `<div class="no-print validate-block" style="position:absolute; bottom:{bottom}; left:{left};">
      <span class="no-user-select">Submit: </span>
      <word id="__final-answer" class="extracted" data-show-ready="__submit-answer" style="width:{width}; top:6px;" />
      <button class="validater ready" id="__submit-answer" data-extracted-id="__final-answer">OK</button>
    </div>`;
  return temp;
}

/**
 * Puzzles that have extractions to a span (not a pattern) need an initial id="extracted",
 * but then want to be able to easily copy that extraction to the submitted field.
 * The calling page may want a style for #__extracted-div, to position it.
 * @returns a template element
 */
function extractedCopiableSpanTemplate() :HTMLTemplateElement {
  const temp = document.createElement('template');
  setDefaultsTemplateArgs(temp, {
    tag: 'div',
    id: 'extracted',
  });
  var inner = 
    `<span id="{id}" data-show-ready="submit-extracted" />
    <button id="submit-extracted" class="copy-extracted btn-shift-up" data-extracted-id="{id}" onclick="copyto_final_answer('{id}')">OK</button>`;
  temp.innerHTML = 
    `<if test="{tag}" eq="span">
      <span id="__extracted-span">` + inner + `</span></if>
    <else>
      <div id="__extracted-div">` + inner + `</div></else>`;
  return temp;
}

/**
 * Puzzles that have extractions to a span (not a pattern) need an initial id="extracted",
 * but then want to be able to easily copy that extraction to the submitted field.
 * The calling page may want a style for #__extracted-div, to position it.
 * @returns a template element
 */
function extractedCopiablePatternTemplate() :HTMLTemplateElement {
  const temp = document.createElement('template');
  setDefaultsTemplateArgs(temp, {
    tag: 'div',
    id: 'extracted',
  });
  var inner = 
    `<if exists="{?pattern}">
      <pattern id="{id}" pattern="{pattern}" data-show-ready="submit-extracted" />
    </if><elseif exists="{?numbered}">
      <pattern id="{id}" extract-numbered="{numbered}" data-show-ready="submit-extracted" />
    </elseif>
    <button id="submit-extracted" class="copy-extracted btn-shift-up" data-extracted-id="{id}" onclick="copyto_final_answer('{id}')">OK</button>`;
  temp.innerHTML = 
    `<if test="{tag}" eq="span">
      <span id="__extracted-span">` + inner + `</span></if>
    <else>
      <div id="__extracted-div">` + inner + `</div></else>`;
  return temp;
}

/**
 * Puzzles that have extractions to a span (not a pattern) need an initial id="extracted",
 * but then want to be able to easily copy that extraction to the submitted field.
 * The calling page may want a style for #__extracted-div, to position it.
 * @returns a template element
 */
function copiablePatternTemplate() :HTMLTemplateElement {
  const temp = document.createElement('template');
  setDefaultsTemplateArgs(temp, {
    tag: 'div',
    id: 'copiable',
  });
  var inner = 
    `<pattern id="{id}" pattern="{pattern}" data-show-ready="submit-copiable" />
    <button id="submit-copiable" class="copy-extracted btn-shift-up" data-extracted-id="{id}" onclick="copyto_final_answer('{id}')">OK</button>`;
  temp.innerHTML = 
    `<if test="{tag}" eq="span">
      <span id="__copiable-span">` + inner + `</span></if>
    <else>
      <div id="__copiable-div">` + inner + `</div></else>`;
  return temp;
}

/**
 * Method to pair with finalAnswer and extractedCopiable* templates
 * @param id ID of extracted, default 'extracted'
 */
export function copyto_final_answer(id:string = 'extracted') {
  const src = document.getElementById(id);
  let dest = document.getElementById("__final-answer");
  const destInputs = dest?.getElementsByTagName('input');
  const btn = document.getElementById("__submit-answer");
  if (src && destInputs && destInputs.length > 0 && btn) {
    var str = "";
    var inputs = src.getElementsByTagName("input");
    if (inputs.length==0) {
      str = src.textContent;
    }
    else {
      for (var i=0; i<inputs.length; i++) {
        str += inputs[i].value;
      }
    }
    destInputs[0].value = str;
    validateInputReady(btn as HTMLButtonElement, 'Enter');
  }
  else {
    console.error('Missing expected elements for copyto_final_answer');
  }
}


var pbnStampTools = [
  {id:'stampPaint', modifier:'ctrl', label:'Paint', img:eventRelStamp('brushH.png'), next:'stampBlank'},
  {id:'stampBlank', modifier:'shift', label:'Blank', img:eventRelStamp('blankH.png'), next:'stampErase'},
  {id:'stampErase', modifier:'alt', label:'Erase', img:eventRelStamp('eraserH.png'), next:'stampPaint'},
];
