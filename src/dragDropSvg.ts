import { info } from "console";
import { findParentOfClass, findParentOfTag, getChildOrder, hasClass, isTag, matrixFromElement, moveChildOrder, mutualAncestor, toggleClass } from "./classUtil";
import { svg_xmlns } from "./tableBuilder";
import { debugTagAttrs } from "./contextError";

type TransformCache = {
  transformer?: DOMMatrix, // The matrix of the element we pretend contains us
  mover: DOMMatrix,        // An offset to the container's matrix
  zOrder: number,          // A desired z-order
};

type SvgDragInfo = {
  id: string,  // ID of the element being dragged
  mover: SVGGraphicsElement,  // The element being dragged
  handle: SVGGraphicsElement,  // The sub-element being dragged (or just the main element)
  transformer?: SVGGraphicsElement,  // The transform-copy parent of the mover
  bounds: DOMRect,  // The bounds of the inntermost handle
  undo: TransformCache,  // Initial state, so we can undo
  hover: SVGGraphicsElement|null,  // The prospective drop-target we're currently over
  client: DOMPoint,  // Initial point of drag, in screen coordinates
  offset: DOMPoint,  // Where within the mover the mouse was clicked, in initial parent coordinates
  translation: DOMPoint,  // Is the mover already translated within its parent?
  click: boolean,  // this might just be a click, not a drag
  freeDrop: SVGSVGElement | null,  // If container is class 'free-drop', many rules are loosened
};

type SvgDropInfo = {
  target: SVGGraphicsElement | SVGSVGElement | null,  // Its current parent, if a drop-target
  origin: DOMPoint,  // Origin of target, in client coordinates
  handle: SVGGraphicsElement,  // Which moving handle hit this target?
  client: DOMPoint,  // Latest client point of drag
  drag: boolean,  // Did this travel far enough to be a drag?
};

var _svgDragInfo:SvgDragInfo|null = null;
var _svgSelectInfo:SvgDragInfo|null = null;

// VOCABULARY
// moveable: any object which can be clicked on to begin a move. Desgined to be <g> elements.
// drop-target: a <g> element that can receive a (single) moveable element
// drag-source: a <g> container of a moveable's starting location. It cannot receive other moveables, but its own moveable can return to it.
//              to achieve that, its ID should be the moveable's ID + "-source"
//              but if sources are interchangeable, then leave off the ID entirely.
// free-drop: a drop-target that is also a free-drop can support a relative transform on the moveable. Otherwise, any transform on the moveable is removed.

// The moveable's positioning should be based at a 0,0 origin provided by the drop-target's transform.
// If "free-drop" is in effect, the moveable will get a transient translation.

// The drop-target may contain other elements inside it, to give it dimensions. Any moveable contents will be placed in front of those.

// Two kinds of movement: Drag-drop and click-twice.
// A single click will select a moveable element.

/**
 * Attach click handlers to the root, and any moveable elements.
 * @root: the ID or class of the root SVG element
 */
export function preprocessSvgDragFunctions(svgId:string) {
    let svg = document.getElementById(svgId) as unknown as SVGSVGElement | null;
    if (svg != null) {
      svg.addEventListener('pointerleave', cancelSvgDrag);
      svg.addEventListener('pointermove', midSvgDrag);
      svg.addEventListener('pointerup', endSvgDrag);
      svg.addEventListener('pointerdown', clickSvgDragCanvas);
    }
    else {
      const svgs = document.getElementsByClassName(svgId);
      for (let i = 0; i < svgs.length; i++) {
        svg = svgs[i] as SVGSVGElement;
        svg.addEventListener('pointerleave', cancelSvgDrag);
        svg.addEventListener('pointermove', midSvgDrag);
        svg.addEventListener('pointerup', endSvgDrag);
        svg.addEventListener('pointerdown', clickSvgDragCanvas);
      }
    }

    const freeDrop = hasClass(svg, 'free-drop');

    const movers = document.getElementsByClassName('moveable');
    for (let i = 0; i < movers.length; i++) {
      const moveable = movers[i] as SVGElement;
      // Every moveable MUST have a transform-copy. If not on itself, in a parent
      let tc = findParentOfClass(moveable, 'transform-copy');
      if (tc == moveable && !freeDrop) {
        console.warn("Usually, the transform-copy node is a parent of the moveable node: " + debugTagAttrs(moveable));
      }
      if (tc) {
        const tcid = tc.getAttributeNS('', 'transform-copy');
        const tSrc = document.getElementById(tcid || '');
        CopyTransformation(tc as SVGElement, tSrc as Element);
      }
      else if (!freeDrop) {
        console.error('Missing transform-copy on ' + debugTagAttrs(moveable));
      }
    }
}

/**
 * Convert a screen coordinate into a point in an element's frame of reference
 * @param element: the SVG element whose frame we're interested in
 * @param clientX: the document X coordinate, as from a pointer event
 * @param clientY: the document Y coordinate, as from a pointer event
 */
function clientToLocalPoint(element: SVGGraphicsElement, clientX: number, clientY: number): DOMPoint {
  const svg = findParentOfTag(element, 'svg') as SVGSVGElement;
  
  // Create a point in screen coordinates
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;

    // Get the consolidated transformation matrix for the element
    const ctm = element.getScreenCTM();
    if (!ctm) return new DOMPoint(NaN, NaN);

    // Transform the point into the element's local coordinate system
    const local = pt.matrixTransform(ctm.inverse());
    return new DOMPoint(local.x, local.y);
}

/**
 * Convert a local element coordinate into a point in screen coordinates
 * @param element: the SVG element whose frame we're starting from
 * @param localX: the local X coordinate
 * @param localY: the local Y coordinate
 */
function localToClientPoint(element: SVGGraphicsElement, localX: number, localY: number): DOMPoint {
  const svg = findParentOfTag(element, 'svg') as SVGSVGElement;

  // Create a point in local coordinates
  const pt = svg.createSVGPoint();
  pt.x = localX;
  pt.y = localY;

  // Get the consolidated transformation matrix for the element
  const ctm = element.getScreenCTM();
  if (!ctm) return new DOMPoint(NaN, NaN);

  // Transform the point into the element's local coordinate system
  const client = pt.matrixTransform(ctm);
  return new DOMPoint(client.x, client.y);
}

/**
 * Start a drag action on the moveable element at this pointer
 * @param evt A pointer down event
 */
function startSvgDrag(evt:PointerEvent) {
  if (evt.pointerType != 'mouse') {
    evt.preventDefault();
  }

  if (_svgDragInfo) {
    cancelSvgDrag(null)
  }
  let mover = firstSvgMoveable(evt.clientX, evt.clientY);
  if (!mover) {
    return;
  }
  assertPlacementByTransform(mover);

  let relPoint = clientToLocalPoint(mover, evt.clientX, evt.clientY);
  let matrix = matrixFromElement(mover);
  let translation = new DOMPoint(matrix.e, matrix.f);

  let handle:SVGGraphicsElement|null = null;
  let bounds = mover.getBoundingClientRect();
  let hDist = NaN;
  const handles = mover.getElementsByClassName('drag-handle');
  for (let i = 0; i < handles.length; i++) {
    const h = handles[i] as SVGGraphicsElement;
    const hrc = h.getBoundingClientRect();
    const dist = Math.hypot(hrc.left + hrc.width / 2 - evt.clientX, hrc.top + hrc.height / 2 - evt.clientY);
    if (handle == null || dist < hDist) {
      handle = h;
      hDist = dist;
      bounds = hrc;
      // relPoint = clientToLocalPoint(mover, hrc.left + hrc.width / 2, hrc.top + hrc.height / 2);
    }
  }

  // Before walking up the parent chain, see if the selected handle has a preferred target, which might be different
  let hover = firstSvgDropTarget(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
  assertPlacementByTransform(handle);

  const tc = findParentOfClass(mover, 'transform-copy') as SVGGraphicsElement;
  const freeDrop = findParentOfClass(mover, 'free-drop');

  _svgDragInfo = {
    id: mover.id,
    mover: mover,
    handle: handle || mover,
    transformer: tc,
    bounds: bounds,
    undo: {
      transformer: tc ? getTransformMatrix(tc) : undefined,
      mover: getTransformMatrix(mover),     // An offset to the container's matrix
      zOrder: getChildOrder(tc ? tc : mover)
    },
    hover: hover,
    client: new DOMPoint(evt.clientX, evt.clientY),
    offset: relPoint,
    translation: translation,
    click: true,  // this might just be a click, not a drag
    freeDrop: freeDrop as SVGSVGElement | null,
  };

  // Move to top-most. Must do this immediately, as it interferes with dragging and clicking if later.
  moveChildOrder(_svgDragInfo.transformer ? _svgDragInfo.transformer : _svgDragInfo.mover, -1);
  toggleClass(mover, 'dragging', true);
  toggleClass(mover, 'selected', true);
  // not yet droppable
}

/**
 * Continue a drag operation, while the mouse is still down.
 * @param evt A pointer move event
 */
function midSvgDrag(evt:PointerEvent) {
  if (_svgDragInfo) {
    if (evt.pointerType != 'mouse') {
      evt.preventDefault();
    }

    var info = calcSvgDropInfo(evt.clientX, evt.clientY);
    if (_svgDragInfo.click && info && info.drag) {
      // We have dragged far enough to be a drag, not just a click
      _svgDragInfo.click = false;
      toggleClass(_svgDragInfo.mover, 'droppable', true);
    }

    if (info && info.target && info.target != _svgDragInfo.hover) {
      // We're hovering over a different target, so update the hover
      if (_svgDragInfo.hover) {
        toggleClass(_svgDragInfo.hover, 'hover', false);
      }
      _svgDragInfo.hover = info.target;
      toggleClass(_svgDragInfo.hover, 'hover', true);

      if (_svgDragInfo.transformer) {
        CopyTransformation(_svgDragInfo.transformer, info.target);
      }
    }

    // Add a translation to the mover, so that it's offset (where we clicked)
    // lands at the current pointer position, accounting for new transforms.
    let local = clientToLocalPoint(_svgDragInfo.mover as SVGGraphicsElement, evt.clientX, evt.clientY);
    local.x -= _svgDragInfo.offset.x;
    local.y -= _svgDragInfo.offset.y;
    _svgDragInfo.mover.style.transform += 'translate(' + local.x + 'px,' + local.y + 'px)';


    // TODO: consider checking for collisions with other moveables
  }
}

/**
 * Find the top-most moveable candidate from a given client coordinate
 * @param clientX pointer event X
 * @param clientY pointer event Y
 * @returns A moveable element, or a child of one, or else null
 */
function firstSvgMoveable(clientX:number, clientY:number): SVGGraphicsElement|null {
  const elements = document.elementsFromPoint(clientX, clientY);
  for (let i = 0; i < elements.length; i++) {
    const elem = elements[i] as Element;
    const mov = findParentOfClass(elem, 'moveable');
    if (mov != null) {
      return mov as SVGGraphicsElement;
    }
  }
  return null;
}

/**
 * Find the top-most drop candidate from a given client coordinate
 * @param clientX pointer event X
 * @param clientY pointer event Y
 * @returns A drop-target or drag-source, or else null
 */
function firstSvgDropTarget(clientX:number, clientY:number): SVGGraphicsElement|null {
  const elements = document.elementsFromPoint(clientX, clientY);
  for (let i = 0; i < elements.length; i++) {
    const elem = elements[i] as Element;
    if (findParentOfClass(elem, 'drag-handle') || findParentOfClass(elem, 'moveable')) {
      // Ignore the moveable item, as its parents may be elsewhere on the page
      continue;
    }
    // The target may not actually be one of the elements, but it might be one of their parents
    // IDEA: do a bounding rect, as a check
    let target = findParentOfClass(elem, 'drop-target') as SVGGraphicsElement|null
    if (target) {
      return target;
    } 

    // Once dragging, drag-sources must match the dragged element 
    // or else have no ID at all, meaning generic.
    target = findParentOfClass(elem, 'drag-source') as SVGGraphicsElement|null;
    if (!_svgDragInfo || (target && (!target.id || (target.id == _svgDragInfo.id + '-source')))) {
      return target;
    }
    else if (_svgDragInfo) {
      const altDragSource = document.getElementById(_svgDragInfo.id + '-source');
      // If user tries to drop a mover on the wrong drag source, redirect them to the right one
      if (altDragSource) {
        return altDragSource as Element as SVGGraphicsElement;
      }
    }
  }
  return null;
}

/**
 * What would happen if we were to drop here?
 * @param progress The drag info from the start of the drag
 * @param evt The latest pointer event
 * @returns A drop info, or null if not over a drop target
 */
function calcSvgDropInfo(clientX:number, clientY:number): SvgDropInfo|null {
  if (_svgDragInfo) {
    let target = _svgDragInfo.freeDrop ? _svgDragInfo.freeDrop : firstSvgDropTarget(clientX, clientY);
    let handle = _svgDragInfo.handle;
    if (!target) {
      // See if any other handles hit targets?
      const handles = _svgDragInfo.mover.getElementsByClassName('drag-handle');
      for (let i = 0; i < handles.length; i++) {
        handle = handles[i] as SVGGraphicsElement;
        const hrc = handle.getBoundingClientRect();
        const hx = hrc.left + hrc.width / 2;
        const hy = hrc.top + hrc.height / 2;
        target = firstSvgDropTarget(hx, hy);
        if (target != null) {
          // At least one handle hit one target
          break;
        }
      }
    }

    let dragging = !_svgDragInfo.click || (target != _svgDragInfo.hover) || _svgDragInfo.freeDrop != null;
    if (!dragging) {
      // We have yet to drag beyond the bounds of the moveable element
      if (clientX < _svgDragInfo.bounds.left || clientX > _svgDragInfo.bounds.right ||
          clientY < _svgDragInfo.bounds.top || clientY > _svgDragInfo.bounds.bottom) {
        // We've dragged outside the bounds
        dragging = true;
      }
    }

    const origin = target == null ? new DOMPoint(NaN, NaN) : localToClientPoint(target, 0, 0);

    return {
      target: target,
      origin: origin,
      handle: handle,
      client: new DOMPoint(clientX, clientY),
      drag: dragging,
    };
  }
  return null;
}

/**
 * Attempt to end a drag operation, and drop the element.
 * @param evt The pointer up event
 */
function endSvgDrag(evt:PointerEvent) {
  if (_svgDragInfo) {
    if (evt.pointerType != 'mouse') {
      evt.preventDefault();
    }

    // REVIEW: could endSvgDrag be called twice?

    let info = calcSvgDropInfo(evt.clientX, evt.clientY);
    if (_svgDragInfo.click && (!info || !info.drag)) {
      // Never started dragging
      // If this is on mouse-/pointer-up, treat this as a click
      if (evt.type.endsWith('up') && _svgDragInfo.mover.onclick) {
        _svgDragInfo.mover.onclick(evt);
      }
      // Leave element selected
      convertSvgDragToSelection();
      return;
    }

    if (!info || !info.target) {
      cancelSvgDrag(null);
      return;
    }

    toggleClass(_svgDragInfo.mover, 'dragging', false);
    toggleClass(_svgDragInfo.mover, 'selected', false);
    toggleClass(_svgDragInfo.mover, 'droppable', false);
    // toggleClass(_svgDragInfo.mover, 'collision', false);

    if (_svgDragInfo.hover) {
      toggleClass(_svgDragInfo.hover, 'hover', false);
    }

    // Add a translation, if needed
    let translate:DOMPoint|null = null;
    if (hasClass(info.target, 'drag-source')) {
      // When returning to the drag source, remove the transform
      _svgDragInfo.mover.style.transform = '';
    }
    else if (hasClass(info.target, 'free-drop')) {
      // Convert the original click offset to the current screen point,
      // but relative to the target origin
      let local = clientToLocalPoint(_svgDragInfo.mover.parentNode as SVGGraphicsElement, evt.clientX, evt.clientY);
      local.x -= _svgDragInfo.offset.x;
      local.y -= _svgDragInfo.offset.y;
      _svgDragInfo.mover.style.transform = 'translate(' + local.x + 'px,' + local.y + 'px)';
    }
    else {
      // Translate to achieve the offset from the handle to the mover's origin,
      // WARNING: All components (handle/mover/target) must be position via 
      //          translate transforms, and not via simple x/y attributes.
      const oH = localToClientPoint(info.handle, 0, 0);
      const oM = localToClientPoint(_svgDragInfo.mover, 0, 0);
      const oT = localToClientPoint(info.target, 0, 0);
      const off = clientToLocalPoint(info.target, oT.x + oM.x - oH.x, oT.y + oM.y - oH.y);
      if (off.x || off.y) {
        _svgDragInfo.mover.style.transform = 'translate(' + off.x + 'px,' + off.y + 'px)';
      }
      else {
        _svgDragInfo.mover.style.transform = '';
      }
    }

    _svgDragInfo = null;
  }
}

/**
 * Abort the current drag operation, and reset the state.
 */
function cancelSvgDrag(evt:PointerEvent|null) {
  if (_svgDragInfo) {
    if (evt && evt.currentTarget && isTag(evt.currentTarget as Element, 'svg')) {
      // We have an event that the mouse left. But did it really?
      var svg = evt.currentTarget as SVGSVGElement;
      var bounds = svg.getBoundingClientRect();
      if (evt.clientX >= bounds.left && evt.clientX <= bounds.right
          && evt.clientY >= bounds.top && evt.clientY <= bounds.bottom) {
        // The pointer is still inside the SVG, so ignore this event
        return;
      }
    }

    toggleClass(_svgDragInfo.mover, 'dragging', false);
    toggleClass(_svgDragInfo.mover, 'selected', false);
    toggleClass(_svgDragInfo.mover, 'droppable', false);
    // toggleClass(_svgDragInfo.mover, 'collision', false);
    if (_svgDragInfo.hover) {
      toggleClass(_svgDragInfo.hover, 'hover', false);
    }
    
    const tc = findParentOfClass(_svgDragInfo.mover, 'transform-copy') as SVGElement;
    if (_svgDragInfo.undo.transformer) {
      setTransformMatrix(tc, _svgDragInfo.undo.transformer);
    }
    setTransformMatrix(_svgDragInfo.mover, _svgDragInfo.undo.mover);

    // Revert to original translation
    if (_svgDragInfo.translation.x || _svgDragInfo.translation.y) {
      _svgDragInfo.mover.style.transform = 'translate(' + _svgDragInfo.translation.x + 'px,' + _svgDragInfo.translation.y + 'px)';
    }
    else {
        _svgDragInfo.mover.style.transform = '';
    }

    _svgDragInfo = null;
  }
}

function convertSvgDragToSelection() {
  if (_svgDragInfo) {
    _svgSelectInfo = _svgDragInfo;
    cancelSvgDrag(null);
    toggleClass(_svgSelectInfo.mover, 'selected', true);
  }
}

function convertSvgSelectionToDrag() {
  if (_svgSelectInfo) {
    _svgDragInfo = _svgSelectInfo;
    _svgSelectInfo = null;
  }
}

/**
 * Implement a 2-click drag equiavlent.
 * The first click is on a moveable element.
 * The second is on a drop target.
 * @param evt 
 */
function clickSvgDragCanvas(evt:PointerEvent) {
  const mover = firstSvgMoveable(evt.clientX, evt.clientY);
  if (_svgSelectInfo) {
    convertSvgSelectionToDrag();
    if (mover != _svgDragInfo?.mover) {
      // This was a click+click. Try to move or cancel.
      var info = calcSvgDropInfo(evt.clientX, evt.clientY);
      if (!info) {
        cancelSvgDrag(null);
      }
      else {
        midSvgDrag(evt);
        endSvgDrag(evt);
        return;
      }
    }
  }

  if (mover) {
    assertPlacementByTransform(mover);
    // Start the drag operation
    startSvgDrag(evt);
  }
}

/**
 * Catch an easy authoring mistake: 
 * Using x/y to position an element, instead of translate(x,y), 
 * breaks the offset-transformations done for placement.
 * @param elmt An element used in drag-drop placement -- mover or destination
 */
function assertPlacementByTransform(elmt:SVGGraphicsElement|null): void {
  if (!elmt) return;
  var bounds = elmt.getBoundingClientRect();
  // The local origin must be inside this rectangle
  var orig = localToClientPoint(elmt, 0, 0);
  if (orig.x < bounds.left || orig.x > bounds.right
      || orig.y < bounds.top || orig.y > bounds.bottom) {
        // It likely isn't using translate(x,y) for positioning.
        console.error(`WARNING: <${debugTagAttrs(elmt)}> has origin (${orig.x},${orig.y}) outside its bounds: `
          + `(left=${bounds.left},top=${bounds.top},right=${bounds.right},bottom=${bounds.bottom}).`);
  }
}

/**
 * Copy the cumulative transformation of one element to another.
 * This is intended for application in an un-transformed layer, 
 * that is a sibling to the layer in which the copied element sits.
 * That way, elem will behave like it is a child of tc.
 * @param elem An element to transform (overwriting any previous transform)
 * @param tc Another element, in a complex transform tree
 */
function CopyTransformation(elem:SVGElement, tc:Element):void {
    // Find mutual parent
    const ancestor = mutualAncestor(elem, tc);
    if (!ancestor) {
        return;
    }

    const matrix = getAccumulatedTransformMatrix(tc, ancestor as Element);
    setTransformMatrix(elem, matrix);
}

/**
 * Calculate the relative transform matrix from the container down to the child.
 * @param child Any element inside container
 * @param container Any element
 * @returns A transform matrix, from the containers frame of reference, to the child's
 */
export function getAccumulatedTransformMatrix(child:Element, container:Element) {
  if (!container.contains(child)) {
    throw new Error("container must be an ancestor of child");
  }

  let matrix = new DOMMatrix(); // Identity matrix
  let current:Element|null = child;

  while (current && current !== container) {
    const localMatrix = getTransformMatrix(current);
    matrix = localMatrix.multiply(matrix);
    current = current.parentElement;
  }

  return matrix;
}

/**
 * The transform set on an element, as a matrix
 * @param elem Any element
 * @returns The 
 */
function getTransformMatrix(elem: Element): DOMMatrix {
    const style = getComputedStyle(elem);
    if (style.transform === 'none') {
      return new DOMMatrix();  // identity
    }
    return new DOMMatrix(style.transform);
}

/**
 * Change an element's transform to a desired matrix
 * @param elem The element
 * @param matrix The matrix
 */
function setTransformMatrix(elem: HTMLElement|SVGElement, matrix: DOMMatrix): void {
  elem.style.transform = `matrix(${matrix.a}, ${matrix.b}, ${matrix.c}, ${matrix.d}, ${matrix.e}, ${matrix.f})`;
}

