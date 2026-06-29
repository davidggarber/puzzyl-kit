import { isDebug } from "./boilerplate";
import { findParentOfClass, findParentOfTag, hasClass, toggleClass } from "./classUtil";
import { Position } from "./dragDrop";
import { getGlobalIndex, indexAllVertices, mapGlobalIndeces, saveStraightEdge } from "./storage";

/**
 * Find the center of an element, in client coordinates
 * @param elmt Any element
 * @returns A position
 */
export function positionFromCenter(elmt:HTMLElement): DOMPoint {
    const rect = elmt.getBoundingClientRect();
    return new DOMPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
}

/**
 * Find the square of the distance between a point and the mouse
 * @param elmt A position, in screen coordinates
 * @param evt A mouse event
 * @returns The distance, squared
 */
export function distance2Mouse(pos:DOMPoint, evt:MouseEvent): number {
    const dx = pos.x - evt.x;
    const dy = pos.y - evt.y;
    return dx * dx + dy * dy;
}

export function distance2(pos:DOMPoint, pos2:DOMPoint): number {
    const dx = pos.x - pos2.x;
    const dy = pos.y - pos2.y;
    return dx * dx + dy * dy;
}

// VOCABULARY
// vertex: any point that can anchor a straight edge
// straight-edge-area: the potential drag range
// ruler-path: a drawn line connecting one or more vertices.
// 
// Ruler ranges can have styles and rules.
// Styles shape the straight edge, which can also be an outline
// Rules dictate drop restrictions and the snap range

/**
 * Scan the page for anything marked vertex or straight-edge-area
 * Those items get click handlers
 * @param areaCls the class name of the root SVG for drawing straight edges
 */
export function preprocessRulerFunctions(mode:string, fill:boolean) {
    selector_class = mode;
    area_class = mode + '-area';
    selector_fill_class = fill ? (selector_class + '-fill') : null;
    let elems = document.getElementsByClassName(area_class);
    for (let i = 0; i < elems.length; i++) {
        preprocessRulerRange(elems[i] as HTMLElement);
        if (fill) {
            ensureFillContiainer(elems[i], mode);
        }
    }

    indexAllVertices();
    // TODO: make lines editable
}

/**
 * When an edge area has a dedicated (mode)-container class,
 * make sure it also has (mode)-fill-container class and (mode)-build-container
 * elements immediately after.
 * @param area The top-level SVG: class="(mode)-area"
 * @param mode The mode name
 */
function ensureFillContiainer(area:Element, mode:string) {
    const containers = area.getElementsByClassName(mode + '-container');
    if (containers && containers.length > 0) {
        let fContainers = area.getElementsByClassName(mode + '-fill-container');
        if (!fContainers || fContainers.length == 0) {
            // If a fill container wasn't provided, create one.
            // It solves a z-order glitch that can occur.
            const container = containers[0];
            const fContainer = container.cloneNode(true) as Element;
            toggleClass(fContainer, mode + '-container', false);
            toggleClass(fContainer, mode + '-fill-container', true);
            container.insertAdjacentElement('afterend', fContainer);
            fContainers = area.getElementsByClassName(mode + '-fill-container');
        }
        let bContainers = area.getElementsByClassName(mode + '-build-container');
        if (!bContainers || bContainers.length == 0) {
            // If a build container wasn't provided, create one, after the fill container.
            const container = fContainers[0];
            const bContainer = container.cloneNode(true) as Element;
            toggleClass(bContainer, mode + '-fill-container', false);
            toggleClass(bContainer, mode + '-build-container', true);
            container.insertAdjacentElement('afterend', bContainer);
        }
    }
}

/**
 * Identified which type of selector is enabled for this page
 * @returns either 'straight-edge' or 'word-select'
 */
export function getStraightEdgeType() {
    return selector_class;
}

/**
 * Hook up the necessary mouse events to each moveable item
 * @param elem a moveable element
 */
function preprocessEndpoint(elem:HTMLElement) {
}

/**
 * Hook up the necessary mouse events to the background region for a ruler
 * @param elem a moveable element
 */
function preprocessRulerRange(elem:HTMLElement) {
    elem.onpointermove=function(e){onRulerHover(e)};
    elem.onpointerdown=function(e){onLineStart(e)};
    elem.onpointerup=function(e){onLineUp(e)};
    elem.onclick=function(e){onClickInArea(e)};
}

/**
 * Supported kinds of straight edges. 
 */
export const EdgeTypes = {
    straightEdge: 'straight-edge',
    wordSelect: 'word-select',
    hashiBridge: 'hashi-bridge',
}

/**
 * Which class are we looking for: should be one of the EdgeTypes
 */
let selector_class:string;
/**
 * A second class, which can overlay the first as a fill
 */
let selector_fill_class:string|null;
/**
 * What is the class of the container: straight-edge-area or word-select-area
 */
let area_class:string;

/**
 * A VertexData contains all the information about a defined vertex in the puzzle
 * @property vertex The element tagged as a vertex
 * @property group (optional) The contained of the vertex, which should react to hovers
 * @property index The global-index of the vertex (assigned during initialization)
 * @property centerPos The center of the vertex, in screen coordinates
 * @property centerPoint The center of the vertex, in svg coordinates
 */
type VertexData = {
    vertex: HTMLElement;
    index: number;
    centerPos: DOMPoint;
    centerPoint: SVGPoint;
    group: HTMLElement;
}

/**
 * A RulerEventData is the collection of all ruler settings that might be useful following a mouse event
 * @property svg the root svg object
 * @property container the container for any straight edges we create
 * @property bounds the bounds of the svg, in client coordinates
 * @property maxPoints an official maximum for how many vertices may be in a single straight-edge
 * @property canShareVertices can two straight-edges share the same vertex?
 * @property hoverRange the maximum distance from a vertex before hover/snap is triggered
 * @property angleConstraints optional limit for connectable vertices to multiples of a base angle (in degrees) - usually 90 or 45, if set at all
 * @property showOpenDrag determines whether a straight-edge, mid-drag, can exist in open space (un-snapped)
 * @property evtPos the position of the mouse event, in client coordinates
 * @property evtPoint the position of the mouse event, in svg coordinates
 * @property nearest the nearest vertex, if any is within the hoverRange of the event
 */
type RulerEventData = {
    svg: SVGSVGElement;
    container: Element;
    fillContainer: Element;
    buildContainer: Element;
    bounds: DOMRect;
    maxPoints: number;
    canShareVertices: boolean;
    canCrossSelf: boolean;
    maxBridges: number,
    bridgeGap: number,
    hoverRange: number;
    angleConstraints?: number;
    angleConstraintsOffset: number;
    turnConstraints?: number[];
    showOpenDrag: boolean;
    evtPos: DOMPoint;
    evtPoint: SVGPoint;
    nearest?: VertexData;
}

function createPartialRulerData(range:Element):RulerEventData {
    const svg = findParentOfTag(range, 'SVG') as SVGSVGElement;
    const containers = svg.getElementsByClassName(selector_class + '-container');
    const container = (containers && containers.length > 0) ? containers[0] : svg;
    const fContainers = svg.getElementsByClassName(selector_class + '-fill-container');
    const fContainer = (fContainers && fContainers.length > 0) ? fContainers[0] : container;
    const bContainers = svg.getElementsByClassName(selector_class + '-build-container');
    const bContainer = (bContainers && bContainers.length > 0) ? bContainers[0] : fContainer;
    const bounds = svg.getBoundingClientRect();
    const max_points = range.getAttributeNS('', 'data-max-points');
    const maxPoints = max_points ? parseInt(max_points) : 2;
    const defaultShare = selector_class == EdgeTypes.hashiBridge ? 'true' : 'false';
    const canShareVertices = range.getAttributeNS('', 'data-can-share-vertices') || defaultShare;
    const defaultCross = selector_class == EdgeTypes.hashiBridge ? 'false' : 'true';
    const canCrossSelf = range.getAttributeNS('', 'data-can-cross-self') || defaultCross;
    const maxBridges = range.getAttributeNS('', 'data-max-bridges');
    const bridgeGap = range.getAttributeNS('', 'data-bridge-gap');
    const hoverRange = range.getAttributeNS('', 'data-hover-range');
    const defaultAngleConstraint = selector_class == EdgeTypes.straightEdge ? undefined 
                                : selector_class == EdgeTypes.wordSelect ? '45' : '90';
    const angleConstraints = range.getAttributeNS('', 'data-angle-constraints') || defaultAngleConstraint;
    const defaultTurnConstraint = selector_class == EdgeTypes.straightEdge ? undefined 
                                : selector_class == EdgeTypes.wordSelect ? '0,45,90' : '0,90';
    const turnConstraints = range.getAttributeNS('', 'data-turn-constraints') || defaultTurnConstraint;
    const showOpenDrag = range.getAttributeNS('', 'data-show-open-drag');
    const angleConstraints2 = angleConstraints ? (angleConstraints+'+0').split('+').map(c => parseInt(c)) : undefined;
    const turnConstraints2 = turnConstraints ? (turnConstraints).split(',').map(c => parseInt(c)) : undefined;
    const data:RulerEventData = {
        svg: svg, 
        container: container,
        fillContainer: fContainer,
        buildContainer: bContainer,
        bounds: bounds,
        maxPoints: maxPoints <= 0 ? 10000 : maxPoints,
        canShareVertices: canShareVertices ? (canShareVertices.toLowerCase() == 'true') : false,
        canCrossSelf: canCrossSelf ? (canCrossSelf.toLowerCase() == 'true') : false,
        maxBridges: maxBridges ? parseInt(maxBridges) : selector_class == EdgeTypes.hashiBridge ? 2 : 1,
        bridgeGap: bridgeGap ? parseInt(bridgeGap) : 8,
        hoverRange: hoverRange ? parseInt(hoverRange) : ((showOpenDrag != 'false') ? 30 : Math.max(bounds.width, bounds.height)),
        angleConstraints: angleConstraints2 ? angleConstraints2[0] : undefined,
        angleConstraintsOffset: angleConstraints2 ? angleConstraints2[1] : 0,
        turnConstraints: turnConstraints2,
        showOpenDrag: showOpenDrag ? (showOpenDrag.toLowerCase() != 'false') : true,
        evtPos: new DOMPoint(NaN, NaN),  // stub
        evtPoint: svg.createSVGPoint(),  // stub 
    };
    return data;
}

/**
 * Looks up the containing area, and any optional settings
 * @param evt A mouse event within the area
 * @returns A RulerEventData
 */
function getRulerData(evt:MouseEvent):RulerEventData {
    const range = findParentOfClass(evt.target as Element, area_class) as HTMLElement;
    const data = createPartialRulerData(range);
    data.evtPos = new DOMPoint(evt.x, evt.y);
    data.evtPoint = data.svg.createSVGPoint();
    data.evtPoint.x = data.evtPos.x - data.bounds.left;
    data.evtPoint.y = data.evtPos.y - data.bounds.top;

    let near = findNearestVertex(data) as HTMLElement;
    if (near) {
        data.nearest = getVertexData(data, near);
    }
    return data;
}

/**
 * Get ruler data as if a user had clicked on a specific vertex
 * @param vertex Any vertex element
 * @returns a RulerEventData
 */
function getRulerDataFromVertex(vertex:HTMLElement):RulerEventData {
    const range = findParentOfClass(vertex, area_class) as HTMLElement;
    const data = createPartialRulerData(range);
    const vBounds = vertex.getBoundingClientRect();
    data.evtPos = new DOMPoint(vBounds.x + vBounds.width / 2, vBounds.y + vBounds.height / 2);
    data.evtPoint = data.svg.createSVGPoint();
    data.evtPoint.x = data.evtPos.x - data.bounds.left;
    data.evtPoint.y = data.evtPos.y - data.bounds.top;

    let near = findNearestVertex(data) as HTMLElement;
    if (near) {
        data.nearest = getVertexData(data, near);
    }
    return data;
}

/**
 * Constructs a vertex data from a vertex
 * @param ruler the containing RulerEventData
 * @param vert a vertex
 * @returns a VertexData
 */
function getVertexData(ruler:RulerEventData, vert:HTMLElement):VertexData {
    const data:VertexData = {
        vertex: vert,
        index: getGlobalIndex(vert, 'vx'),
        group: (findParentOfClass(vert, 'vertex-g') as HTMLElement) || vert,
        centerPos: positionFromCenter(vert),
        centerPoint: ruler.svg.createSVGPoint()    
    };
    data.centerPoint.x = data.centerPos.x - ruler.bounds.left;
    data.centerPoint.y = data.centerPos.y - ruler.bounds.top;
    return data;
}

/**
 * All straight edges on the page, except for the one under construction
 */
let _straightEdges:SVGPolylineElement[] = [];
/**
 * The nearest vertex, if being affected by hover
 */
let _hoverEndpoint:HTMLElement|null = null;
/**
 * A straight edge under construction
 */
let _straightEdgeBuilder:SVGPolylineElement|null = null;
/**
 * The vertices that are part of the straight edge under construction
 */
let _straightEdgeVertices:HTMLElement[] = [];

/**
 * Handler for both mouse moves and mouse drag
 * @param evt The mouse move event
 */
function onRulerHover(evt:MouseEvent) {
    const ruler = getRulerData(evt);
    if (!ruler) {
        return;
    }
    const inLineIndex = ruler.nearest ? indexInLine(ruler.nearest.vertex) : -1;
    if (_straightEdgeBuilder && inLineIndex >= 0) {
        if (inLineIndex == _straightEdgeVertices.length - 2) {
            // Dragging back to the start contracts the line
            _straightEdgeBuilder.points.removeItem(inLineIndex + 1);
            toggleClass(_straightEdgeVertices[inLineIndex + 1], 'building', false);
            _straightEdgeVertices.splice(inLineIndex + 1, 1);
        }
        // Hoving near any other index is ignored
        return;
    }
    if (_straightEdgeBuilder) {
        // Extending a straight-edge that we've already started
        if (ruler.nearest || ruler.showOpenDrag) {
            const extendLast = extendsLastSegment(ruler.nearest);
            const updateOpen = _straightEdgeBuilder.points.length > _straightEdgeVertices.length;
            if (extendLast || _straightEdgeBuilder.points.length >= ruler.maxPoints) {
                if (updateOpen) {
                    _straightEdgeBuilder.points.removeItem(_straightEdgeVertices.length);
                }
                if (extendLast || !updateOpen) {
                    toggleClass(_straightEdgeVertices[ruler.maxPoints - 1], 'building', false);
                    _straightEdgeVertices.splice(_straightEdgeVertices.length - 1, 1);
                    _straightEdgeBuilder.points.removeItem(_straightEdgeVertices.length);
                }
            }
            else if (_straightEdgeVertices.length < _straightEdgeBuilder.points.length) {
                // Always remove the last open end
                _straightEdgeBuilder.points.removeItem(_straightEdgeBuilder.points.length - 1);
            }
        }
        if (_straightEdgeVertices.length < ruler.maxPoints) {
            if (ruler.nearest && isReachable(ruler, ruler.nearest)) {
                // Extend to new point
                snapStraightLineTo(ruler, ruler.nearest);
            }
            else if (ruler.showOpenDrag) {
                openStraightLineTo(ruler);
            }
        }
    }
    else {
        // Hovering near a point
        if (ruler.nearest?.group != _hoverEndpoint) {
            toggleClass(_hoverEndpoint, 'hover', false);
            toggleClass(ruler.nearest?.group as HTMLElement, 'hover', true);
            _hoverEndpoint = ruler.nearest?.group || null;
        }
    }
}
/**
 * Starts a drag from the nearest vertex to the mouse
 * @param evt Mouse down event
 */
function onLineStart(evt:MouseEvent) {
    const ruler = getRulerData(evt);
    if (!ruler || !ruler.nearest) {
        return;
    }

    if (!ruler.canShareVertices && hasClass(ruler.nearest.vertex, 'has-line')) {
        // User has clicked a point that already has a line
        // Either re-select it or delete it
        const edge = findStraightEdgeFromVertex(ruler, ruler.nearest.index);
        if (edge) {
            const vertices = findStraightEdgeVertices(edge);
            // Always delete the existing edge
            deleteStraightEdge(edge);
            if (vertices.length == 2) {
                // Restart line
                if (vertices[0] == ruler.nearest.vertex) {
                    createStraightLineFrom(ruler, getVertexData(ruler, vertices[1]));
                }
                else {
                    createStraightLineFrom(ruler, getVertexData(ruler, vertices[0]));
                }
                snapStraightLineTo(ruler, ruler.nearest);
            }
            return;
        }
    }

    createStraightLineFrom(ruler, ruler.nearest);
}

/**
 * Ends a straight-edge creation on mouse up
 * @param evt Mouse up event
 */
function onLineUp(evt:MouseEvent) {
    const ruler = getRulerData(evt);
    if (!ruler || !_straightEdgeBuilder) {
        return;
    }

    // Clean up classes that track active construction
    const indeces:number[] = [];
    for (let i = 0; i < _straightEdgeVertices.length; i++) {
        toggleClass(_straightEdgeVertices[i], 'building', false);
        toggleClass(_straightEdgeVertices[i], 'has-line', _straightEdgeBuilder != null);
        indeces.push(getGlobalIndex(_straightEdgeVertices[i], 'vx'));
    }

    const vertexList = ','+indeces.join(',')+',';
    completeStraightLine(ruler, vertexList);
}

/**
 * Create a new straight-edge, starting at one vertex
 * @param ruler The containing area and rules
 * @param start The first vertex (can equal ruler.nearest, which is otherwise ignored)
 */
function createStraightLineFrom(ruler:RulerEventData, start:VertexData) {
    _straightEdgeVertices = [];
    _straightEdgeVertices.push(start.vertex);

    _straightEdgeBuilder = document.createElementNS('http://www.w3.org/2000/svg', 'polyline') as SVGPolylineElement;
    toggleClass(_straightEdgeBuilder, selector_class, true);
    toggleClass(_straightEdgeBuilder, 'building', true);
    toggleClass(start.vertex, 'building', true);
    _straightEdgeBuilder.points.appendItem(start.centerPoint);
    ruler.buildContainer.appendChild(_straightEdgeBuilder);

    toggleClass(_hoverEndpoint, 'hover', false);
    _hoverEndpoint = null;
}

/**
 * Extend a straight-edge being built to a new vertex
 * @param ruler The containing area and rules
 * @param next A new vertex
 */
function snapStraightLineTo(ruler:RulerEventData, next:VertexData) {
    _straightEdgeVertices.push(next.vertex);
    _straightEdgeBuilder?.points.appendItem(next.centerPoint);
    toggleClass(_straightEdgeBuilder, 'open-ended', false);
    toggleClass(next.vertex, 'building', true);
}

/**
 * Extend a straight-edge into open space
 * @param ruler The containing area and rules, including the latest event coordinates
 */
function openStraightLineTo(ruler:RulerEventData) {
    toggleClass(_straightEdgeBuilder, 'open-ended', true);
    _straightEdgeBuilder?.points.appendItem(ruler.evtPoint);
}

/**
 * Vertex lists are identifiers, so normalize them to be low-to-high
 * @param vertexList A comma-delimited list of vertex indeces
 * @param edge A Polyline, whose points would also need to be reversed
 * @returns An equivalent list, where the first is always < last
 */
function normalizeVertexList(vertexList:string, edge?:SVGPolylineElement):string {
    let list = vertexList.split(',').map(v => parseInt(v));
    if (list.length > 2 && list[1] > list[list.length - 2]) {
        // Reverse the point list too
        if (edge) {
            const pts:SVGPoint[] = [];
            for (let i = edge.points.length - 1; i >= 0; i--) {
                pts.push(edge.points[i]);
            }
            edge.points.clear();
            for (let i = 0; i < pts.length; i++) {
                edge.points.appendItem(pts[i]);
            }
        }

        // Reverse the vertex list
        const rev = list.map(n => isNaN(n) ? '' : String(n)).reverse();
        return rev.join(',');
    }
    return vertexList;  // unchanged
}

/**
 * Convert the straight line being built to a finished line
 * @param ruler The containing area and rules
 * @param vertexList A string join of all the vertex indeces
 * @param save Determines whether this edge is saved. It should be false when loading from a save.
 */
function completeStraightLine(ruler:RulerEventData, vertexList:string, save:boolean = true) {
    if (!_straightEdgeBuilder) {
        return;
    }
    if (_straightEdgeVertices.length < 2) {
        // Incomplete without at least two snapped ends. Abandon
        ruler.buildContainer.removeChild(_straightEdgeBuilder);
        _straightEdgeBuilder = null;
        return;
    }
    else if (_straightEdgeBuilder.points.length > _straightEdgeVertices.length) {
        // Remove open-end
        _straightEdgeBuilder.points.removeItem(_straightEdgeVertices.length);
        toggleClass(_straightEdgeBuilder, 'open-ended', false);
    }

    vertexList = normalizeVertexList(vertexList, _straightEdgeBuilder);
    const dupes:Element[] = findDuplicateEdges(ruler, 'data-vertices', vertexList, selector_class, []);
    if (dupes.length >= ruler.maxBridges && _straightEdgeBuilder) {
        // Disallow any more duplicates
        ruler.buildContainer.removeChild(_straightEdgeBuilder);
        _straightEdgeBuilder = null;
    }

    if (_straightEdgeBuilder) {
        // Convert to a normal (non-building) bridge
        // Move from build container to regular container (lower z-order)
        ruler.buildContainer.removeChild(_straightEdgeBuilder);
        toggleClass(_straightEdgeBuilder, 'building', false);
        ruler.container.appendChild(_straightEdgeBuilder);
        _straightEdgeBuilder.setAttributeNS('', 'data-vertices', vertexList);
        _straightEdges.push(_straightEdgeBuilder);

        if (selector_fill_class) {
            const fill = document.createElementNS('http://www.w3.org/2000/svg', 'polyline') as SVGPolylineElement;
            toggleClass(fill, selector_fill_class, true);
            for (let i = 0; i < _straightEdgeBuilder.points.length; i++) {
                fill.points.appendItem(_straightEdgeBuilder.points[i]);
            }
            ruler.fillContainer.appendChild(fill);  // will always be after the original
        }

        dupes.push(_straightEdgeBuilder);
        if (dupes.length > 1) {
            // We have duplicates, so spread them apart
            for (let d = 0; d < dupes.length; d++) {
                const offset = dupes.length == 1 ? 0
                    : (dupes.length % 2) == 0 ? (ruler.bridgeGap / 2) * (d * 2 - (dupes.length - 1))
                    : ruler.bridgeGap * (d - Math.floor(dupes.length / 2));
                offsetBridge(ruler, dupes[d] as SVGPolylineElement, offset);
            }
        }
        
        if (save) {
            saveStraightEdge(vertexList, true);
        }
    }

    _straightEdgeVertices = [];
    _straightEdgeBuilder = null;
}

/**
 * Move an edge sideways by some amount by turning a simple segment into a C shape.
 * Alternatively, remove the C shape, and return to the simple segment.
 * @param edge The polyline to modify
 * @param offset The amount to offset, or 0 to remove the C shape
 */
function offsetBridge(ruler:RulerEventData, edge:SVGPolylineElement, offset:number) {
    if (edge.points.length < 2) {
        return;
    }

    const oldPoints = (edge as Element).getAttributeNS('', 'points') || '';

    const start = edge.points[0];
    const end = edge.points[edge.points.length - 1];

    const normal = {x:start.y - end.y, y:end.x - start.x}
    const lenNormal = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    normal.x /= lenNormal;
    normal.y /= lenNormal;

    edge.points.clear();
    edge.points.appendItem(start);
    if (offset != 0) {
        const p1 = ruler.svg.createSVGPoint();
        const p2 = ruler.svg.createSVGPoint();
        p1.x = start.x + normal.x * offset;
        p1.y = start.y + normal.y * offset
        p2.x = end.x + normal.x * offset;
        p2.y = end.y + normal.y * offset
        edge.points.appendItem(p1);
        edge.points.appendItem(p2);
    }
    edge.points.appendItem(end);

    if (selector_fill_class) {
        const fills = findDuplicateEdges(ruler, 'points', oldPoints, selector_fill_class, []);
        if (fills.length > 0) {
            // Change just 1 to match
            fills[0].setAttributeNS('', 'points', edge.getAttributeNS('', 'points') || '');
        }
    }
}

/**
 * Checks to see if an vertex is already in the current straightline
 * @param end an vertex
 * @returns The index of this element in the straight edge
 */
function indexInLine(end: HTMLElement):number {
    if (!_straightEdgeVertices || !end) {
        return -1;
    }
    for (let i = 0; i < _straightEdgeVertices.length; i++) {
        if (_straightEdgeVertices[i] == end) {
            return i;
        }
    }
    return -1;
}

/**
 * Does a proposed vertex extend the last segment in the straight-edge under construction?
 * @param vert A new vertex
 * @returns true if this vertex is in the same direction as the last segment, either shorter or longer
 */
function extendsLastSegment(vert:VertexData|undefined):boolean {
    if (!vert || !_straightEdgeBuilder || _straightEdgeVertices.length < 2) {
        return false;
    }
    const last = _straightEdgeBuilder.points[_straightEdgeVertices.length - 1];
    const prev = _straightEdgeBuilder.points[_straightEdgeVertices.length - 2];
    const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
    const err = Math.atan2(vert.centerPoint.y - prev.y, vert.centerPoint.x - prev.x) - angle;
    return Math.abs(err * 180 / Math.PI) < 1;
}

/**
 * Uses a form a dot-product to detect if the sweep from segment AB to AC is counter-clockwise
 * @param a Start of both segments
 * @param b First endpoint
 * @param c Second endpoint
 * @returns true if sweep is to the left (counter-clockwise)
 */
function segmentPointCCW(a:SVGPoint, b:SVGPoint, c:SVGPoint) {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

/**
 * A point is on a line if the slope is the same, and the distance
 * is a fraction of the segment's between 0 and 1
 * @param pt Point to test
 * @param a Start of segments
 * @param b End of endpoint
 * @returns true if point lies on the segment between a and b
 */
function pointOnSegment(pt:SVGPoint, a:SVGPoint, b:SVGPoint) {
    if (pt == a || pt == b) {
        return true;
    }
    if (a.x == b.x) {
        return pt.x == a.x && pt.y >= Math.min(a.y, b.y) && pt.y <= Math.max(a.y, b.y);
    }
    if (a.y == b.y) {
        return pt.y == a.y && pt.x >= Math.min(a.x, b.x) && pt.x <= Math.max(a.x, b.x);
    }
    const dxS = b.x - a.x;
    const dyS = b.y - a.y;
    const dxP = pt.x - a.x;
    const dyP = pt.y - a.y;
    const pctX = dxP / dxS;
    const pctY = dyP / dyS;
    return pctX == pctY && pctX > 0 && pctY < 1;
}

/**
 * Sweep algorithm to determine if two segments intersect
 * @param a Start of first segment
 * @param b End of first segment
 * @param c Start of second segment
 * @param d End of second segment
 * @returns true if they intersect along both segments
 */
function segmentsIntersect(a:SVGPoint, b:SVGPoint, c:SVGPoint, d:SVGPoint) {
    return (segmentPointCCW(a, c, d) != segmentPointCCW(b, c, d)
            && segmentPointCCW(a, b, c) != segmentPointCCW(a, b, d))
        || (pointOnSegment(c, a, b) || pointOnSegment(d, a, b)
            || pointOnSegment(a, c, d) || pointOnSegment(b, c, d));
}

/**
 * Detect if extending a polyline would cause an intersection with itself
 * @param pt Candidate point to add to polyline
 * @param points Points from a polyline
 * @returns True
 */
function polylineSelfIntersection(pt:SVGPoint, points:SVGPointList) {
    if (points.length <= 1) {
        return false;
    }
    const p0 = points[points.length - 1];
    for (let i = 1; i < points.length - 1; i++) {
        if (segmentsIntersect(p0, pt, points[i - 1], points[i])) {
            segmentsIntersect(p0, pt, points[i - 1], points[i]);
            return true;
        }
    }
    return false;
}

/**
 * Enforces vertex angle constraints
 * @param data The containing area and rules
 * @param vert A new vertex
 * @returns 
 */
function isReachable(data:RulerEventData, vert: VertexData):boolean {
    if (!_straightEdgeBuilder || _straightEdgeVertices.length < 1) {
        return false;
    }
    
    if (!data.canCrossSelf && polylineSelfIntersection(vert.centerPoint, _straightEdgeBuilder.points)) {
        return false;
    }

    //if (indexInLine(vert.vertex) >= 0) return false;

    const prev = getVertexData(data, _straightEdgeVertices[_straightEdgeVertices.length - 1]);
    const dx = vert.centerPos.x - prev.centerPos.x;
    const dy = vert.centerPos.y - prev.centerPos.y;
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        return false;  // Can't re-select the previous point
    }
    else if (data.angleConstraints == undefined) {
        return true;  // Any other point is valid
    }
    const degrees = Math.atan2(dy, dx) * 180 / Math.PI + 360;
    let mod = Math.abs((degrees + data.angleConstraintsOffset) % data.angleConstraints);
    if (mod > data.angleConstraints / 2) {
        mod = data.angleConstraints - mod;
    }
    if (mod >= 1) {  // Must be within 1 degree of constraint angle pattern
        return false;
    };

    if (data.turnConstraints !== undefined && _straightEdgeVertices.length >= 2) {
        const prior = getVertexData(data, _straightEdgeVertices[_straightEdgeVertices.length - 2]);
        const dx2 = prev.centerPos.x - prior.centerPos.x;
        const dy2 = prev.centerPos.y - prior.centerPos.y;
        if (Math.abs(dx2) <= 1 && Math.abs(dy2) <= 1) {
            return false;  // That would mean previous 2 points are the same
        }
        let turn = Math.abs(Math.atan2(dy2, dx2) * 180 / Math.PI + 360 - degrees);
        turn = Math.min(turn, 360 - turn);
        for (let i = 0; i < data.turnConstraints.length; i++) {
            if (Math.abs(turn - data.turnConstraints[i]) < 1) {
                return true;
            }
        }
        return false;
    }
    return true;
}

/**
 * For various reasons, multiple edges can ocupy the same space. Find them all.
 * @param attr The attribute to check
 * @param points The points attribute
 * @param cls A class name to search through
 * @param dupes A list of elements to append to
 */
function findDuplicateEdges(rules:RulerEventData, attr:string, points:string, cls:string, dupes:Element[]):Element[] {
    const list = rules.svg.getElementsByClassName(cls);
    for (let i = 0; i < list.length; i++) {
        const elmt = list[i] as Element;
        if (elmt.getAttributeNS('', attr) === points) {
            dupes.push(elmt);
        }
    }
    return dupes;
}

/**
 * Delete an existing straight-edge
 * @param edge The edge to remove
 */
function deleteStraightEdge(edge:SVGPolylineElement) {
    const range = findParentOfClass(edge, area_class) as HTMLElement;
    const data = createPartialRulerData(range);

    for (let i = 0; i < _straightEdges.length; i++) {
        if (_straightEdges[i] === edge) {
            _straightEdges.splice(i, 1);
            break;
        }
    }

    // See if there's a duplicate straight-edge, of class word-select
    let dupes:Element[] = [];
    const points = (edge as Element).getAttributeNS('', 'points');
    if (points) {
        dupes = findDuplicateEdges(data, 'points', points, selector_class, []);
        if (selector_fill_class) {
            dupes = findDuplicateEdges(data, 'points', points, selector_fill_class, dupes);
        }
    }

    let vertexList:string = '';
    for (let d = 0; d < dupes.length; d++) {
        const dupe = dupes[d];
        if (!vertexList) {
            vertexList = dupe.getAttributeNS('', 'data-vertices') || '';
            if (vertexList) {
                saveStraightEdge(vertexList as string, false);  // Deletes from the saved list
            }        
        }
        dupe.parentNode?.removeChild(dupe);
    }

    // See if there were any parallel bridges
    dupes = findDuplicateEdges(data, 'data-vertices', vertexList, selector_class, []);
    if (dupes.length >= 1) {
        // If so, re-layout to show fewer
        for (let d = 0; d < dupes.length; d++) {
            const offset = dupes.length == 1 ? 0
                : (dupes.length % 2) == 0 ? (data.bridgeGap / 2) * (d * 2 - (dupes.length - 1))
                : data.bridgeGap * (d - Math.floor(dupes.length / 2));
            offsetBridge(data, dupes[d] as SVGPolylineElement, offset);
        }
    }
}

/**
 * Find the vertex nearest to the mouse event, and within any snap limit
 * @param data The containing area and rules, including mouse event details
 * @returns A vertex data, or null if none close enough
 */
function findNearestVertex(data:RulerEventData):Element|null {
    let min = data.hoverRange * data.hoverRange;
    const vertices = data.svg.getElementsByClassName('vertex');
    let nearest:HTMLElement|null = null;
    for (let i = 0; i < vertices.length; i++) {
        const end = vertices[i] as HTMLElement;
        const center = positionFromCenter(end);
        const dist = distance2(center, data.evtPos);
        if (min < 0 || dist < min) {
            min = dist;
            nearest = end;
        }
    }
    return nearest;
}

function distanceToPoint(a: SVGPoint, b: SVGPoint):number {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

function distanceToLine(edge: SVGPolylineElement, pt: SVGPoint) {
    const ret = {
        distance: NaN,
        ptOnLine: {x:NaN, y:NaN},
        fractionAlongLine: NaN
    };

    // For our uses, points attribute is always x0 y0 x1 y1
    if (!edge.points || edge.points.length < 2) { 
        return ret; 
    }
    const p0 = edge.points[0];
    const p1 = edge.points[edge.points.length - 1];

    // Line form: ax + by + c = 0
    const dy = p1.y - p0.y;
    const dx = p1.x - p0.x;
    const line = {
        a: dy,
        b: -dx,
        c: -(dy * p0.x - dx * p0.y) };
    const edgeLen = Math.sqrt(dy * dy + dx * dx);  // Length of edge
    if (dy == 0) {
        ret.distance = Math.abs(pt.y - p0.y);  // Horizontal line
    }
    else if (dx == 0) {
        ret.distance = Math.abs(pt.x - p0.x);  // Vertical line
    }
    else {
        ret.distance = Math.abs(line.a * pt.x + line.b * pt.y + line.c) / edgeLen;
    }

    // Normal vector
    const nx = dy / edgeLen;
    const ny = -dx / edgeLen;
    // To find point p2 on the line nearest pt, move ret.distance along the normal
    // However, not sure which direction, so consider either way along normal from pt
    const n1 = {x: pt.x + nx * ret.distance, y: pt.y + ny * ret.distance};
    const n2 = {x: pt.x - nx * ret.distance, y: pt.y - ny * ret.distance};
    // Then take the pt with where ax + by + c is closest to 0
    ret.ptOnLine = Math.abs(line.a * n1.x + line.b * n1.y + line.c) < Math.abs(line.a * n2.x + line.b * n2.y + line.c) 
        ? n1 : n2;

    // Calculate where on line, where 0 == p0 and 1 == p1
    ret.fractionAlongLine = line.b != 0 
        ? (ret.ptOnLine.x - p0.x) / -line.b
        : (ret.ptOnLine.y - p0.y) / line.a;
    
    // If fraction is outside [0..1], then distance is to the nearer endpoint
    if (ret.fractionAlongLine < 0) {
        ret.distance = distanceToPoint(pt, p0);
    }
    else if (ret.fractionAlongLine > 1) {
        ret.distance = distanceToPoint(pt, p1);
    }

    return ret;
}

/**
 * Find the vertex nearest to the mouse event, and within any snap limit
 * @param data The containing area and rules, including mouse event details
 * @returns An edge, or null if none is close enough
 */
function findEdgeUnder(data:RulerEventData):SVGPolylineElement|null {
    let min = data.hoverRange;
    const edges = data.svg.getElementsByClassName(selector_class);
    let nearest:SVGPolylineElement|null = null;
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i] as SVGPolylineElement;
        const dtl = distanceToLine(edge as SVGPolylineElement, data.evtPoint);
        if (dtl.distance < min && dtl.fractionAlongLine > 0.1 && dtl.fractionAlongLine < 0.9) {
            // We're reasonably near the line segment
            min = dtl.distance;
            nearest = edge;
        }
    }
    return nearest;
}

/**
 * Find the first straight-edge which includes the specified vertex
 * @param index The global index of a vertex
 * @returns A straight edge, or null if none match
 */
function findStraightEdgeFromVertex(ruler:RulerEventData, index:number):SVGPolylineElement|null {
    const pat = ',' + String(index) + ',';
    const edges = ruler.svg.getElementsByClassName(selector_class);
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i] as SVGPolylineElement;
        const indexList = edge.getAttributeNS('', 'data-vertices')
        if (indexList && indexList.search(pat) >= 0) {
            return edge;
        };
    }
    return null;
}

/**
 * Given a straight edge, enumerate the vertices that it passes through
 * @param edge A straight-edge
 * @returns An array of zero or more vertices
 */
function findStraightEdgeVertices(edge:SVGPolylineElement):HTMLElement[] {
    const indexList = edge.getAttributeNS('', 'data-vertices')
    const vertices:HTMLElement[] = [];
    const indeces = indexList?.split(',').map((s) => parseInt(s));
    if (indeces) {
        const map = mapGlobalIndeces('vertex', 'vx');
        for (let i = 0; i < indeces.length; i++) {
            if (indeces[i]) {
                const vertex = map[indeces[i]];
                vertices.push(vertex);
            }
        }        
    }
    return vertices;
}

/**
 * Create a straight-edge from a list of vertices
 * Called while restoring from a save, so does not redundantly save progress.
 * @param vertexList A joined list of vertex global-indeces, delimeted by commas
 */
export function createFromVertexList(vertexList:string) {
    const map = mapGlobalIndeces('vertex', 'vx');
    const vertices:string[] = vertexList.split(',');
    let ruler:RulerEventData|null = null;
    for (let i = 0; i < vertices.length; i++) {
        if (vertices[i].length > 0) {
            const id = parseInt(vertices[i]);
            const vert = map[id];
            if (vert) {
                if (ruler == null) {
                    ruler = getRulerDataFromVertex(vert);
                    createStraightLineFrom(ruler, ruler.nearest as VertexData);
                }
                else {
                    snapStraightLineTo(ruler, getVertexData(ruler, vert));
                }
                // Both of the above set 'building', but complete does not clear it
                toggleClass(vert, 'building', false);
            }
        }
    }
    if (ruler) {
        completeStraightLine(ruler, vertexList, false/*no save while restoring*/);
    }
}

export function clearAllStraightEdges(id:string) {
    const svg = document.getElementById(id);
    if (!svg) {
        return;
    }

    const edges = svg.getElementsByClassName(selector_class);
    for (let i = edges.length - 1; i >= 0; i--) {
        const edge = edges[i];
        edge.parentNode?.removeChild(edge);
    }

    // Remove styles from all vertices
    const vertices = svg.getElementsByClassName('vertex');
    for (let i = 0; i < _straightEdgeVertices.length; i++) {
        toggleClass(vertices[i], 'building', false);
        toggleClass(vertices[i], 'has-line', false);
    }

    // Remove builder
    _straightEdgeVertices = [];
    _straightEdgeBuilder = null;
}

function onClickInArea(evt:MouseEvent) {
    const ruler = getRulerData(evt);
    if (!ruler.nearest) {
        // Don't delete an edge if the user is more likely click on the vertex
        const edge = findEdgeUnder(ruler);
        if (edge) {
            deleteStraightEdge(edge);
        }
    }
}