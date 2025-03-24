import { PairMap } from "../structure/pair-map";
import { IDrawable, IDrawableOverlay, IHoverable } from "./canvas";
import { CommonNumbers, Vec2 } from "./math";

const VERTEX_RADIUS = 20;
const EDGE_HITBOX = 10;

export type Hovered = {
	type: "vertex" | "rect" | "text";
	id: number;
}

export class StateTransition {
	readonly destination: number;
	readonly read: string;
	readonly write: string;
	readonly move: string;

	constructor(dest: number, read: string, write: string, move: string) {
		this.destination = dest;
		this.read = read;
		this.write = write;
		this.move = move;
	}

	toEdgeString() {
		return `${this.read}, ${this.write}, ${this.move}`;
	}
}

export class StateVertex implements IDrawable, IDrawableOverlay, IHoverable {
	readonly id: number;
	private position: Vec2;
	transitions: StateTransition[] = [];
	graph?: StateGraph;
	hovered = false;
	private label?: string;

	constructor(id: number, position: Vec2) {
		this.id = id;
		this.position = position;
		this.hovered = false;
	}

	addTransitions(...transitions: StateTransition[]) {
		this.transitions.push(...transitions);
		return this;
	}

	getPosition() {
		return this.position;
	}

	setPosition(position: Vec2) {
		this.position = position;
		this.graph?.updateVertexPosition(this.id);
		window.dispatchEvent(new Event("tm:edit-prop"));
		return true;
	}

	getLabel() {
		return this.label;
	}

	setLabel(label?: string) {
		this.label = label;
		return true;
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (this.hovered) ctx.fillStyle = "#fff";
		else ctx.fillStyle = "#7f7f7f";
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, VERTEX_RADIUS, 0, CommonNumbers.PI2);
		ctx.fill();

		if (this.hovered) ctx.fillStyle = "#7f7f7f";
		else ctx.fillStyle = "#fff";
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
		return this.hovered = position.subVec(this.position).magnitudeSqr() <= VERTEX_RADIUS * VERTEX_RADIUS;
	}
}

export class StateEdge implements IDrawable, IHoverable {
	private start: Vec2;
	private end: Vec2;
	private mid?: Vec2;
	transitions: StateTransition[];
	hovered = false;

	constructor(start: Vec2, end: Vec2) {
		this.start = start;
		this.end = end;
		this.transitions = [];
		this.updateMid();
	}

	setStart(start: Vec2) {
		this.start = start;
		this.updateMid();
	}

	setEnd(end: Vec2) {
		this.end = end;
		this.updateMid();
	}

	private updateMid() {
		if (this.start.x != this.end.x && this.start.y != this.end.y)
			this.mid = new Vec2(this.start.x, this.end.y);
		else
			this.mid = undefined;
	}

	addTransition(transition: StateTransition) {
		this.transitions.push(transition);
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.beginPath();
		ctx.moveTo(this.start.x, this.start.y);
		if (this.mid) {
			// start and end are not axis-aligned. need to use mid-point
			ctx.lineTo(this.mid.x, this.mid.y);
		}
		ctx.lineTo(this.end.x, this.end.y);
		if (this.hovered) ctx.strokeStyle = "#0f0";
		else ctx.strokeStyle = "#fff";
		ctx.stroke();

		// draw arrow head
		const endInv = (this.mid || this.start).subVec(this.end).withMagnitude(VERTEX_RADIUS);
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
		
		// draw text
		let offset: Vec2;
		let start: Vec2;
		if (!this.mid) {
			offset = this.end.subVec(this.start).scale(0.5);
			start = this.start;
		} else {
			const off1 = this.end.subVec(this.mid).scale(0.5), off2 = this.mid.subVec(this.start).scale(0.5);
			if (off1.magnitudeSqr() > off2.magnitudeSqr()) {
				offset = off1;
				start = this.mid;
			} else {
				offset = off2;
				start = this.start;
			}
		}
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
			this.transitions.reverse().forEach((trans, ii) => ctx.fillText(trans.toEdgeString(), pos.x, pos.y - ii * size * 1.2));
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
		if (this.mid) {
			return this.hovered = this.isSegmentHovered(position, scale, this.start, this.mid) || this.isSegmentHovered(position, scale, this.mid, this.end);
		} else {
			return this.hovered = this.isSegmentHovered(position, scale, this.start, this.end);
		}
	}
}

export class StateRect implements IDrawable, IHoverable {
	private start: Vec2;
	private end: Vec2;
	private size: Vec2;
	private color: string;
	hovered = false;

	constructor(start: Vec2, end: Vec2, color: number | string) {
		this.start = start;
		this.end = end;
		this.size = this.end.subVec(this.start);
		if (typeof color == "string") this.color = color;
		else this.color = color.toString(16).padStart(6, "0");
	}

	getStart() {
		return this.start;
	}

	setStart(start: Vec2) {
		this.start = start;
		this.size = this.end.subVec(this.start);
		window.dispatchEvent(new Event("tm:edit-prop"));
		return true;
	}

	getEnd() {
		return this.end;
	}

	setEnd(end: Vec2) {
		this.end = end;
		this.size = this.end.subVec(this.start);
		window.dispatchEvent(new Event("tm:edit-prop"));
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

	isHovered(position: Vec2) {
		const offset = position.subVec(this.start);
		const hori = this.size.scale(1, 0);
		const vert = this.size.scale(0, 1);
		return this.hovered =
			offset.dot(hori) > 0 && offset.dot(hori) <= this.size.x * this.size.x && // inside horizontally
			offset.dot(vert) > 0 && offset.dot(vert) <= this.size.y * this.size.y // inside vertically
	}
}

export class StateText implements IDrawable, IHoverable {
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
}

class StateGraph implements IDrawable, IDrawableOverlay {
	private vertices = new Map<number, StateVertex>();
	private edges = new PairMap<number, number, StateEdge>;
	private tmpEdge?: { edge: StateEdge, start: number };
	private rects = new Map<number, StateRect>();
	private texts = new Map<number, StateText>();
	private hovered?: Hovered;
	private hoveredEdge?: [number, number];
	private componentCounter = 0;

	addVertex(vertex: StateVertex) {
		vertex.graph = this;
		this.vertices.set(vertex.id, vertex);
		this.edges.deleteA(vertex.id);
		vertex.transitions.forEach(trans => {
			const dest = this.vertices.get(trans.destination);
			if (dest) {
				let edge: StateEdge;
				if (this.edges.has(vertex.id, dest.id)) edge = this.edges.get(vertex.id, dest.id)!;
				else this.edges.set(vertex.id, dest.id, edge = new StateEdge(vertex.getPosition(), dest.getPosition()));
				edge.addTransition(trans);
			}
		});
	}

	getVertex(id: number) {
		return this.vertices.get(id);
	}
	
	updateVertexPosition(id: number) {
		const vertex = this.vertices.get(id);
		if (!vertex) return;
		this.edges.forEachOfA(vertex.id, edge => edge.setStart(vertex.getPosition()));
		this.edges.forEachOfB(vertex.id, edge => edge.setEnd(vertex.getPosition()));
	}

	updateVertexEdges(id: number) {
		const vertex = this.vertices.get(id);
		if (!vertex) return;
		this.edges.deleteA(vertex.id);
		vertex.transitions.forEach(trans => {
			const dest = this.vertices.get(trans.destination);
			if (dest) {
				let edge: StateEdge;
				if (this.edges.has(vertex.id, dest.id)) edge = this.edges.get(vertex.id, dest.id)!;
				else this.edges.set(vertex.id, dest.id, edge = new StateEdge(vertex.getPosition(), dest.getPosition()));
				edge.addTransition(trans);
			}
		});
	}

	createVertex(position: Vec2) {
		const id = this.vertices.size > 0 ? Array.from(this.vertices.keys()).reduce((a, b) => Math.max(a, b)) + 1 : 1;
		const vertex = new StateVertex(id, position);
		this.addVertex(vertex);
	}

	// creates an temporary edge
	createTmpEdge(start: number, end: Vec2) {
		const vert = this.vertices.get(start);
		if (!vert) return null;
		this.tmpEdge ={ edge: new StateEdge(vert.getPosition(), end), start };
		return this.tmpEdge.edge;
	}

	finalizeTmpEdge(end?: number) {
		if (!this.tmpEdge) return;
		const vert = this.vertices.get(this.tmpEdge.start);
		if (!vert || end === undefined) {
			this.tmpEdge = undefined;
			return;
		}
		vert.addTransitions(new StateTransition(end, "t", "t", "-"));
		this.updateVertexEdges(vert.id);
		this.tmpEdge = undefined;
	}

	addRect(rect: StateRect) {
		this.rects.set(this.componentCounter++, rect);
	}

	getRect(id: number) {
		return this.rects.get(id);
	}

	addText(text: StateText) {
		this.texts.set(this.componentCounter++, text);
	}

	getText(id: number) {
		return this.texts.get(id);
	}

	draw(ctx: CanvasRenderingContext2D) {
		// draw rectangles
		this.rects.forEach(r => r.draw(ctx));
		// draw texts
		this.texts.forEach(t => t.draw(ctx));
		// draw edges
		let topEdge: StateEdge | undefined;
		this.edges.forEach((edge, src, dest) => {
			if (this.hoveredEdge && this.hoveredEdge[0] == src && this.hoveredEdge[1] == dest) topEdge = edge;
			else edge.draw(ctx);
		});
		this.tmpEdge?.edge.draw(ctx);
		topEdge?.draw(ctx);
		// draw vertices
		this.vertices.forEach(v => v.draw(ctx));
	}

	drawOverlay(ctx: CanvasRenderingContext2D, mousePosition: Vec2) {
		this.vertices.forEach(v => v.drawOverlay(ctx, mousePosition));
	}
	
	mouseTick(position: Vec2, scale: number) {
		this.hovered = undefined;
		let hovEdge: [number, number] | undefined;
		for (const [id, vertex] of this.vertices.entries())
			if (vertex.isHovered(position) && this.hovered === undefined)
				this.hovered = { type: "vertex", id };
		for (const [src, dest, edge] of this.edges.entries())
			if (edge.isHovered(position, scale) && hovEdge === undefined)
				hovEdge = [src, dest];
		for (const [id, text] of this.texts.entries())
			if (text.isHovered(position) && this.hovered === undefined)
				this.hovered = { type: "text", id };
		for (const [id, rect] of this.rects.entries())
			if (rect.isHovered(position) && this.hovered === undefined)
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
}

const graph = new StateGraph();
// testing
graph.addVertex(new StateVertex(2, new Vec2(200, 150)));
graph.addVertex(new StateVertex(1, new Vec2(100, 200)).addTransitions(
	new StateTransition(2, "a", "b", "L"),
	new StateTransition(2, "b", "a", "R")
));
export default graph;