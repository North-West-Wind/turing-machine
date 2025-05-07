import { TransitionNode } from "../../logic/States/Transitions/TransitionNode";
import { HeadTransition, TransitionStatement } from "../../logic/States/Transitions/TransitionStatement";
import { TapeSymbols } from "../../logic/Tapes/TapesUtilities/TapeSymbols";
import { TuringMachineConfig } from "../../logic/TuringMachineConfig";
import { PairMap } from "../structure/pair-map";
import { IDrawable, IDrawableOverlay, IHoverable, ISaveable } from "./canvas";
import { SaveableUI, SaveableUIBox, SaveableUIText, SaveableUIVertex } from "./machine";
import { CommonNumbers, Vec2 } from "./math";
import { Editable } from "./simulator";

const VERTEX_RADIUS = 20;
const EDGE_HITBOX = 9;
const RECT_CORNER_HITBOX = 10;

export class StateTransition {
	readonly destination: number;
	readonly read: string[];
	readonly write: string[];
	readonly move: number[];

	constructor(dest: number, read: string[], write: string[], move: number[]) {
		this.destination = dest;
		this.read = read;
		this.write = write;
		this.move = move;
	}

	toEdgeString() {
		if (this.read.length >= 2)
			return `(${this.read.join(", ")}), (${this.write.join(", ")}), (${this.move.join(", ")})`;
		return `${this.read}, ${this.write}, ${this.move}`;
	}
}

export class StateVertex implements IDrawable, IDrawableOverlay, IHoverable, ISaveable<SaveableUIVertex> {
	static readonly colors = ["#"]

	readonly id: number;
	private position: Vec2;
	transitions: StateTransition[] = [];
	graph?: StateGraph;
	hovered = false;
	private label?: string;
	private _final = false;
	private _start = false;
	private _current = false;

	constructor(id: number, position: Vec2) {
		this.id = id;
		this.position = position;
		this.hovered = false;
	}

	addTransitions(...transitions: StateTransition[]) {
		this.transitions.push(...transitions);
		this.graph?.updateVertexEdges(this.id);
		return this;
	}

	setTransitions(...transitions: StateTransition[]) {
		this.transitions = transitions;
		console.log("setting transition for %d", this.id, this.transitions);
		this.graph?.updateVertexEdges(this.id);
		return this;
	}

	deleteTransition(transition: StateTransition) {
		const found = this.transitions.findIndex(trans =>
			trans == transition ||
			trans.destination == transition.destination &&
			trans.read == transition.read &&
			trans.write == transition.write &&
			trans.move == transition.move
		);
		if (found < 0) return;
		this.transitions.splice(found, 1);
		
	}

	getPosition() {
		return this.position;
	}

	setPosition(position: Vec2) {
		this.position = position;
		this.graph?.updateVertexPosition(this.id);
		return true;
	}

	getLabel() {
		return this.label;
	}

	setLabel(label?: string) {
		this.label = label;
		return true;
	}

	isFinal() {
		return this._final;
	}

	setFinal(val: boolean) {
		// no outward edges
		if (val && this.graph?.getOutEdges(this.id)?.size) return false;
		this._final = val;
		return true;
	}

	isStart() {
		return this._start;
	}

	setStart(val: boolean) {
		this._start = val;
	}

	isCurrent() {
		return this._current;
	}

	setCurrent(val: boolean) {
		this._current = val;
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = this.color(this.hovered ? "flip" : "", this._current ? "current" : "");
		if (this._start) {
			ctx.fillRect(this.position.x - VERTEX_RADIUS, this.position.y - VERTEX_RADIUS, VERTEX_RADIUS * 2, VERTEX_RADIUS * 2);
		} else {
			if (this._final) {
				ctx.fillStyle = this.color("dark", this.hovered ? "flip" : "", this._current ? "current" : "");
				ctx.beginPath();
				ctx.arc(this.position.x, this.position.y, VERTEX_RADIUS * 1.5, 0, CommonNumbers.PI2);
				ctx.fill();
				ctx.fillStyle = this.color(this.hovered ? "flip" : "", this._current ? "current" : "");
			}
			ctx.beginPath();
			ctx.arc(this.position.x, this.position.y, VERTEX_RADIUS, 0, CommonNumbers.PI2);
			ctx.fill();
		}

		ctx.fillStyle = this.color(!this.hovered ? "flip" : "", this._current ? "current" : "");
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillText(this.id.toString(), this.position.x, this.position.y);
	}

	drawOverlay(ctx: CanvasRenderingContext2D, mousePosition: Vec2) {
		if (this.hovered && this.label) {
			const size = ctx.canvas.height / 30;
			ctx.font = `${size}px Courier New`;
			ctx.fillStyle = "#333333";
			const width = ctx.measureText(this.label).width;
			ctx.fillRect(mousePosition.x, mousePosition.y, width + size, size * 2);
			ctx.textAlign = "left";
			ctx.textBaseline = "top";
			ctx.fillStyle = "#fff";
			ctx.fillText(this.label, mousePosition.x + size * 0.5, mousePosition.y + size * 0.5);
		}
	}

	isHovered(position: Vec2) {
		if (this._start) {
			// rectangle hover
			const vec = position.subVec(this.position.sub(VERTEX_RADIUS, VERTEX_RADIUS));
			return this.hovered = vec.x >= 0 && vec.x <= VERTEX_RADIUS * 2 && vec.y >= 0 && vec.y <= VERTEX_RADIUS * 2;
		}
		return this.hovered = position.subVec(this.position).magnitudeSqr() <= VERTEX_RADIUS * VERTEX_RADIUS;
	}

	private color(...modifiers: ("flip" | "dark" | "current" | "")[]) {
		let flag = 0;
		if (modifiers.includes("flip")) flag |= 1;
		if (modifiers.includes("dark")) flag |= 2;
		if (modifiers.includes("current")) flag |= 4;
		switch (flag) {
			case 1: return "#fff"; // flip
			case 2: return "#4f4f4f"; // dark
			case 3: return "#ccc"; // flip + dark
			case 4: return "#279314"; // current
			case 5: return "#b8dfb6"; // current + flip
			case 6: return "#185a0c"; // current + dark
			case 7: return "#85a183"; // current + dark + flip
			default: return "#7f7f7f";
		}
	}

	toSaveable() {
		return {
			label: this.label,
			position: this.position.toSaveable()
		};
	}
}

export class StateEdge implements IDrawable, IHoverable {
	private start: Vec2;
	private end: Vec2;
	private lines: Vec2[]; // lines MUST be alternating between horizontal and vertical (whatever starts)
	transitions: StateTransition[];
	hovered = false;
	private temporary = false;

	constructor(start: Vec2, end: Vec2, temporary = false) {
		this.start = start;
		this.end = end;
		if (start.x != end.x && start.y != end.y && !temporary)
			this.lines = [new Vec2(0, end.y - start.y), new Vec2(end.x - start.x, 0)];
		else
			this.lines = [temporary ? Vec2.ZERO : end.subVec(start)];
		this.transitions = [];
		this.temporary = temporary;
	}

	setStart(start: Vec2) {
		const offset = start.subVec(this.start);
		this.start = start;
		if (this.lines[0].isVertical()) {
			if (this.lines[0].x != start.x) {
				if (!this.lines[1]) this.lines.push(new Vec2(this.end.x - start.x, 0)); // no intermediate, so we add one
				else this.lines[1] = this.lines[1].add(-offset.x, 0); // extend/shrink the next line
			}
			if (this.lines[0].y != start.y) {
				this.lines[0] = this.lines[0].add(0, -offset.y);
			}
		} else {
			if (this.lines[0].y != start.y) {
				if (!this.lines[1]) this.lines.push(new Vec2(0, this.end.y - start.y)); // no intermediate, so we add one
				else this.lines[1] = this.lines[1].add(0, -offset.y); // extend/shrink the next line
			}
			if (this.lines[0].x != start.x) {
				this.lines[0] = this.lines[0].add(-offset.x, 0);
			}
		}
		this.fold();
	}

	setEnd(end: Vec2) {
		const offset = end.subVec(this.end);
		this.end = end;
		const last = this.lines[this.lines.length - 1];
		// during temp mode, lines can change directions
		if (this.temporary) {
			let start = this.start;
			for (let ii = 0; ii < this.lines.length - 1; ii++)
				start = start.addVec(this.lines[ii]);
			const diff = end.subVec(start);
			if (Math.abs(diff.x) > Math.abs(diff.y)) this.lines[this.lines.length - 1] = new Vec2(diff.x, 0);
			else this.lines[this.lines.length - 1] = new Vec2(0, diff.y);
			return;
		}
		if (last.isVertical()) {
			if (last.x != end.x) {
				if (this.lines.length <= 1) this.lines.unshift(new Vec2(end.x - this.start.x, 0));
				else this.lines[this.lines.length - 2] = this.lines[this.lines.length - 2].add(offset.x, 0);
			}
			if (last.y != end.y) {
				this.lines[this.lines.length - 1] = last.add(0, offset.y);
			}
		} else {
			if (last.y != end.y) {
				if (this.lines.length <= 1) this.lines.unshift(new Vec2(0, end.y - this.start.y));
				else this.lines[this.lines.length - 2] = this.lines[this.lines.length - 2].add(0, offset.y);
			}
			if (last.x != end.x) {
				this.lines[this.lines.length - 1] = last.add(offset.x, 0);
			}
		}
		this.fold();
	}

	commitLine() {
		if (!this.temporary) return;
		this.lines.push(Vec2.ZERO);
	}

	// Check all lines to see if they are alternating
	// If not, fold them
	private fold() {
		if (this.temporary) return;
		for (let ii = 0; ii < this.lines.length - 1; ii++) {
			if (this.lines[ii].isVertical() == this.lines[ii+1].isVertical()) {
				this.lines[ii] = this.lines[ii].addVec(this.lines[ii+1]);
				this.lines.splice(ii+1, 1);
			}
		}
	}

	addTransition(transition: StateTransition) {
		this.transitions.push(transition);
	}

	deleteTransition(index: number) {
		return this.transitions.splice(index, 1)[0];
	}

	resetTransitions() {
		this.transitions = [];
	}

	copyTransitions(edge: StateEdge) {
		this.transitions = Array.from(edge.transitions);
	}

	getLines() {
		return this.lines;
	}

	setLines(lines: Vec2[]) {
		this.lines = lines;
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.beginPath();
		ctx.moveTo(this.start.x, this.start.y);
		let start = this.start;
		for (const line of this.lines) {
			start = start.addVec(line);
			ctx.lineTo(start.x, start.y);
		}
		if (this.hovered) ctx.strokeStyle = "#0f0";
		else ctx.strokeStyle = "#fff";
		ctx.stroke();

		// draw arrow head
		if (!this.temporary) {
			const endInv = this.lines[this.lines.length - 1].inv().withMagnitude(VERTEX_RADIUS);
			const tip = this.end.addVec(endInv);
			ctx.beginPath();
			ctx.moveTo(tip.x, tip.y);
			const side = endInv.perpendicular().scale(0.5);
			const p1 = tip.addVec(endInv).addVec(side);
			const p2 = tip.addVec(endInv).subVec(side);
			ctx.lineTo(p1.x, p1.y);
			ctx.lineTo(p2.x, p2.y);
			if (this.hovered) ctx.fillStyle = "#0f0";
			else ctx.fillStyle = "#fff";
			ctx.fill();
		}
		
		// draw text
		// find longest line
		const { index, line } = this.lines.map((line, index) => ({ index, line })).reduce((a, b) => a.line.magnitudeSqr() > b.line.magnitudeSqr() ? a : b);
		let offset = line.scale(0.5);
		start = this.start;
		for (let ii = 0; ii < index; ii++)
			start = start.addVec(this.lines[ii]);
		const perpendicular = offset.perpendicular();
		if (offset.x == 0) {
			// vertical
			ctx.textBaseline = "middle";
			if (perpendicular.x > 0) ctx.textAlign = "left"; // vector points right
			else ctx.textAlign = "right"; // vector points left
		} else {
			// horizontal
			ctx.textAlign = "center";
			if (perpendicular.y > 0) ctx.textBaseline = "top"; // vector points down
			else ctx.textBaseline = "bottom"; // vector points up
		}
		const pos = start.addVec(offset).addVec(perpendicular.withMagnitude(10));
		const size = ctx.canvas.height / 30;
		ctx.font = ` ${size}px Courier New`;
		if (perpendicular.y < 0) {
			// special case: text is rendered above line segment
			this.transitions.forEach((trans, ii) => ctx.fillText(trans.toEdgeString(), pos.x, pos.y - (this.transitions.length - ii - 1) * size * 1.2));
		} else this.transitions.forEach((trans, ii) => ctx.fillText(trans.toEdgeString(), pos.x, pos.y + ii * size * 1.2));
	}

	private isSegmentHovered(position: Vec2, scale: number, a: Vec2, b: Vec2) {
		// project vec from start to perpendicular of arrow
		const arrow = b.subVec(a);
		const magSqr = position.subVec(a).projectTo(arrow.perpendicular()).magnitudeSqr();
		const hovered = magSqr <= (EDGE_HITBOX * scale * EDGE_HITBOX * scale);
		if (hovered) {
			// project vec from start to parallel of arrow
			const proj = position.subVec(a).projectTo(arrow);
			const magSqr = proj.magnitudeSqr();
			if (proj.dot(arrow) < 0) {
				// projection is reverse direction
				return magSqr + arrow.magnitudeSqr() <= (EDGE_HITBOX * scale * EDGE_HITBOX * scale);
			} else {
				// projection is same direction
				return magSqr - arrow.magnitudeSqr() <= (EDGE_HITBOX * scale * EDGE_HITBOX * scale);
			}
		} else return false;
	}

	isHovered(position: Vec2, scale: number) {
		let hov = false;
		// if temporary, not hoverable
		if (!this.temporary) {
			let pos = this.start;
			for (const line of this.lines) {
				const nextPos = pos.addVec(line);
				hov = this.isSegmentHovered(position, scale, pos, nextPos) || hov;
				pos = nextPos;
			}
		}
		return this.hovered = hov;
	}

	untemporary() {
		this.temporary = false;
		let start = this.start;
		this.lines.forEach(line => start = start.addVec(line));
		this.end = start;
	}
}

// A normalization for StateRect:
// All components "start" (x, y) must be smaller than "end"
// This is done so moving corners can be more efficient
export class StateRect implements IDrawable, IHoverable, ISaveable<SaveableUIBox> {
	private start: Vec2;
	private end: Vec2;
	private corners!: Vec2[];
	private size!: Vec2;
	private color: string;
	hovered = false;
	private hoveredCorner = -1;
	private movingCorner = false;

	constructor(start: Vec2, end: Vec2, color: number | string) {
		this.start = start;
		this.end = end;
		this.normalize();
		this.computeExtra();
		if (typeof color == "string") this.color = color;
		else this.color = color.toString(16).padStart(6, "0");
	}

	private normalize() {
		if (this.start.x > this.end.x) {
			const x = this.start.x;
			this.start = new Vec2(this.end.x, this.start.y);
			this.end = new Vec2(x, this.end.y);
		}
		if (this.start.y > this.end.y) {
			const y = this.start.y;
			this.start = new Vec2(this.start.x, this.end.y);
			this.end = new Vec2(this.end.x, y);
		}
	}

	private computeExtra() {
		this.size = this.end.subVec(this.start);
		this.corners = [this.start, this.end, this.start.add(this.size.x, 0), this.start.add(0, this.size.y)];
	}

	getStart() {
		return this.start;
	}

	setStart(start: Vec2) {
		this.start = start;
		this.normalize();
		this.computeExtra();
		return true;
	}

	getEnd() {
		return this.end;
	}

	setEnd(end: Vec2) {
		this.end = end;
		this.normalize();
		this.computeExtra();
		return true;
	}

	getColor() {
		return this.color;
	}

	setColor(color: number | string) {
		const old = this.color;
		if (typeof color == "string") this.color = color;
		else this.color = color.toString(16).padStart(6, "0");

		if (!/^[0-9a-fA-F]{6}$/.test(this.color)) {
			this.color = old;
			return false;
		}
		return true;
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = `#${this.color}`;
		ctx.fillRect(this.start.x, this.start.y, this.size.x, this.size.y);
	}

	isHovered(position: Vec2, scale: number) {
		// Check which corner is hovered
		// Don't change if we are moving a corner
		if (!this.movingCorner) {
			this.hoveredCorner = -1;
			for (let ii = 0; ii < this.corners.length; ii++) {
				if (position.subVec(this.corners[ii]).magnitudeSqr() <= (RECT_CORNER_HITBOX * RECT_CORNER_HITBOX * scale * scale)) {
					this.hoveredCorner = ii;
					break;
				}
			}
		}

		const offset = position.subVec(this.start);
		const hori = this.size.scale(1, 0);
		const vert = this.size.scale(0, 1);
		return this.hovered =
			offset.dot(hori) > 0 && offset.dot(hori) <= this.size.x * this.size.x && // inside horizontally
			offset.dot(vert) > 0 && offset.dot(vert) <= this.size.y * this.size.y // inside vertically
	}

	setMovingCorner(state: boolean) {
		this.movingCorner = state;
	}

	moveCornerTo(position: Vec2) {
		if (this.hoveredCorner == -1) return;
		switch (this.hoveredCorner) {
			case 0:
				this.start = position;
				break;
			case 1:
				this.end = position;
				break;
			case 2:
				this.start = new Vec2(this.start.x, position.y);
				this.end = new Vec2(position.x, this.end.y);
				break;
			case 3:
				this.start = new Vec2(position.x, this.start.y);
				this.end = new Vec2(this.end.x, position.y);
				break;
			default:
				return;
		}
		this.normalize();
		this.computeExtra();
	}

	toSaveable() {
		return {
			start: this.start.toSaveable(),
			size: this.size.toSaveable(),
			color: parseInt(this.color, 16)
		};
	}
}

export class StateText implements IDrawable, IHoverable, ISaveable<SaveableUIText> {
	private value: string;
	private position: Vec2;
	hovered = false;
	// properties used for determining hovered
	private width = 0;
	private height = 0;

	constructor(value: string, position: Vec2) {
		this.value = value;
		this.position = position;
	}

	draw(ctx: CanvasRenderingContext2D) {
		const size = ctx.canvas.height / 30;
		ctx.font = `${size}px Courier New`;
		if (this.hovered) ctx.fillStyle = "#0ff";
		else ctx.fillStyle = "#fff";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(this.value, this.position.x, this.position.y);

		this.width = ctx.measureText(this.value).width;
		this.height = size;
	}

	isHovered(position: Vec2) {
		const offset = position.subVec(this.position);
		return this.hovered = Math.abs(offset.x) <= this.width * 0.5 && Math.abs(offset.y) <= this.height * 0.5;
	}

	getValue() {
		return this.value;
	}

	setValue(value: string) {
		if (!value) return false;
		this.value = value;
		return true;
	}

	getPosition() {
		return this.position;
	}

	setPosition(position: Vec2) {
		this.position = position;
		return true;
	}

	toSaveable() {
		return {
			pos: this.position.toSaveable(),
			value: this.value
		};
	}
}

export class StateGraph implements IDrawable, IDrawableOverlay, ISaveable<Omit<SaveableUI, "color">> {
	private vertices: (StateVertex | null)[] = [];
	private edges = new PairMap<number, number, StateEdge>;
	private tmpEdge?: { edge: StateEdge, start: number };
	private rects: (StateRect | null)[] = [];
	private texts: (StateText| null)[] = [];
	private hovered?: Editable;
	private hoveredEdge?: [number, number];
	private heads = 0;
	private startingNode = -1;
	private currentState = -1;

	addVertex(vertex: StateVertex | null, id?: number) {
		if (!vertex) {
			if (!id) return;
			for (let ii = 0; ii <= id - this.vertices.length; ii++)
				this.vertices.push(null);
			return;
		}
		vertex.graph = this;
		// respect vertex id, as all use cases have that figured out
		for (let ii = 0; ii <= vertex.id - this.vertices.length; ii++)
			this.vertices.push(null);
		this.vertices[vertex.id] = vertex;
	}

	deleteVertex(id: number) {
		if (!this.vertices[id]) return;
		if (this.vertices.length == id + 1) this.vertices.pop();
		else if (this.vertices[id]) this.vertices[id] = null;
		this.edges.deleteA(id);
	}

	getVertex(id: number) {
		return this.vertices[id];
	}

	getVertices() {
		return this.vertices.entries();
	}
	
	updateVertexPosition(id: number) {
		const vertex = this.vertices[id];
		if (!vertex) return;
		this.edges.forEachOfA(vertex.id, edge => edge.setStart(vertex.getPosition()));
		this.edges.forEachOfB(vertex.id, edge => edge.setEnd(vertex.getPosition()));
	}

	updateVertexEdges(id: number) {
		const vertex = this.vertices[id];
		if (!vertex) return;
		this.edges.forEachOfA(vertex.id, edge => edge.resetTransitions());
		vertex.transitions.forEach(trans => {
			const dest = this.vertices[trans.destination];
			if (dest) {
				let edge: StateEdge;
				if (this.edges.has(vertex.id, dest.id)) edge = this.edges.get(vertex.id, dest.id)!;
				else this.edges.set(vertex.id, dest.id, edge = new StateEdge(vertex.getPosition(), dest.getPosition()));
				edge.addTransition(trans);
			}
		});
	}

	createVertex(position: Vec2) {
		const nullIndex = this.vertices.indexOf(null);
		const id = nullIndex >= 0 ? nullIndex : this.vertices.length;
		const vertex = new StateVertex(id, position);
		this.addVertex(vertex);
	}

	setStartingNode(id: number) {
		this.vertices[this.startingNode]?.setStart(false);
		this.vertices[id]?.setStart(true);
		this.startingNode = id;
	}

	unsetStartingNode() {
		this.vertices[this.startingNode]?.setStart(false);
		this.startingNode = -1;
	}

	// creates an temporary edge
	createTmpEdge(start: number, end: Vec2) {
		const vert = this.vertices[start];
		if (!vert) return null;
		this.tmpEdge ={ edge: new StateEdge(vert.getPosition(), end, true), start };
		return this.tmpEdge.edge;
	}

	finalizeTmpEdge(end?: number) {
		if (!this.tmpEdge) return;
		this.tmpEdge.edge.untemporary();
		const vert = this.vertices[this.tmpEdge.start];
		if (!vert || end === undefined || this.vertices[end] === null || this.heads <= 0) {
			this.tmpEdge = undefined;
			return;
		}
		if (this.edges.has(vert.id, end)) {
			this.tmpEdge.edge.copyTransitions(this.edges.get(vert.id, end)!);
		} else {
			const arr = Array(this.heads).fill(0);
			const trans = new StateTransition(end, arr.map(() => TapeSymbols.Blank), arr.map(() => TapeSymbols.Blank), arr);
			vert.addTransitions(trans);
			this.tmpEdge.edge.addTransition(trans);
		}
		this.tmpEdge.edge.setStart(vert.getPosition());
		this.tmpEdge.edge.setEnd(this.vertices[end].getPosition());
		this.edges.set(vert.id, end, this.tmpEdge.edge);
		vert.setFinal(false);
		this.tmpEdge = undefined;
	}

	discardTmpEdge() {
		this.tmpEdge = undefined;
	}

	deleteEdge(src: number, dest: number) {
		this.edges.delete(src, dest);
	}

	rawAddRect(rect: StateRect | null) {
		this.rects.push(rect);
	}

	addRect(rect: StateRect) {
		const replacement = this.rects.indexOf(null);
		if (replacement >= 0) this.rects[replacement] = rect;
		else this.rects.push(rect);
	}

	deleteRect(id: number) {
		if (!this.rects[id]) return;
		if (this.rects.length == id + 1) this.rects.pop();
		else if (this.rects[id]) this.rects[id] = null;
	}

	getRect(id: number) {
		return this.rects[id];
	}

	rawAddText(text: StateText | null) {
		this.texts.push(text);
	}

	addText(text: StateText) {
		const replacement = this.texts.indexOf(null);
		if (replacement >= 0) this.texts[replacement] = text;
		else this.texts.push(text);
	}

	deleteText(id: number) {
		if (!this.texts[id]) return;
		if (this.texts.length == id + 1) this.texts.pop();
		else if (this.texts[id]) this.texts[id] = null;
	}

	getText(id: number) {
		return this.texts[id];
	}

	draw(ctx: CanvasRenderingContext2D) {
		// draw rectangles
		this.rects.forEach(r => r?.draw(ctx));
		// draw texts
		this.texts.forEach(t => t?.draw(ctx));
		// draw edges
		let topEdge: StateEdge | undefined;
		this.edges.forEach((edge, src, dest) => {
			if (this.hoveredEdge && this.hoveredEdge[0] == src && this.hoveredEdge[1] == dest) topEdge = edge;
			else edge.draw(ctx);
		});
		this.tmpEdge?.edge.draw(ctx);
		topEdge?.draw(ctx);
		// draw vertices
		ctx.font = ` ${ctx.canvas.height / 30}px Courier New`;
		this.vertices.forEach(v => v?.draw(ctx));
	}

	drawOverlay(ctx: CanvasRenderingContext2D, mousePosition: Vec2) {
		this.vertices.forEach(v => v?.drawOverlay(ctx, mousePosition));
	}
	
	mouseTick(position: Vec2, scale: number) {
		this.hovered = undefined;
		let hovEdge: [number, number] | undefined;
		for (const vertex of this.vertices)
			if (vertex?.isHovered(position) && this.hovered === undefined)
				this.hovered = { type: "vertex", id: vertex.id };
		for (const [src, dest, edge] of this.edges.entries())
			if (edge.isHovered(position, scale) && hovEdge === undefined)
				hovEdge = [src, dest];
		for (let id = 0; id < this.texts.length; id++)
			if (this.texts[id]?.isHovered(position) && this.hovered === undefined)
				this.hovered = { type: "text", id };
		for (let id = 0; id < this.rects.length; id++)
			if (this.rects[id]?.isHovered(position, scale) && this.hovered === undefined)
				this.hovered = { type: "rect", id };
		this.hoveredEdge = hovEdge;
		return this.hovered;
	}

	getInEdges(id: number) {
		return this.edges.getB(id);
	}

	getOutEdges(id: number) {
		return this.edges.getA(id);
	}

	getEdge(src: number, dest: number) {
		return this.edges.get(src, dest);
	}

	private unescapeSymbol(symbol: string) {
		switch (symbol) {
			case "\\p": return TapeSymbols.Pause;
			case "\\r": return TapeSymbols.Running;
			default: return symbol;
		}
	}

	updateConfig(config: TuringMachineConfig) {
		config.TransitionNodes = Array.from(this.vertices.keys()).map(key => new TransitionNode(key));
		config.StartNode = new TransitionNode(this.startingNode);
		config.Statements = this.edges.entries().map(([src, dest, edge]) => {
			return edge.transitions.map(trans => {
				return new TransitionStatement(
					new TransitionNode(src),
					new TransitionNode(dest),
					Array(config.NumberOfHeads)
						.fill((ii: number) => new HeadTransition(trans.read[ii], this.unescapeSymbol(trans.write[ii]), trans.move[ii]))
						.map((func, ii) => func(ii))
				);
			});
		}).flat();
	}

	setHeads(heads: number) {
		this.heads = heads;
		this.forceTransitions();
	}

	private forceTransitions() {
		this.edges.forEach(edge => {
			edge.transitions.forEach(transition => {
				if (transition.read.length > this.heads) transition.read.splice(this.heads - transition.read.length);
				else if (transition.read.length < this.heads) transition.read.push(...Array(this.heads - transition.read.length).fill(TapeSymbols.Blank));
				if (transition.write.length > this.heads) transition.write.splice(this.heads - transition.write.length);
				else if (transition.write.length < this.heads) transition.write.push(...Array(this.heads - transition.write.length).fill(TapeSymbols.Blank));
				if (transition.move.length > this.heads) transition.move.splice(this.heads - transition.move.length);
				else if (transition.move.length < this.heads) transition.move.push(...Array(this.heads - transition.move.length).fill(0));
			});
		});
	}

	setCurrentState(state: number) {
		this.vertices[this.currentState]?.setCurrent(false);
		this.vertices[state]?.setCurrent(true);
		this.currentState = state;
	}

	toSaveable() {
		return {
			boxes: this.rects.map(rect => rect?.toSaveable() || null),
			texts: this.texts.map(text => text?.toSaveable() || null),
			nodes: this.vertices.map(vert => vert?.toSaveable() || null)
		}
	}
}