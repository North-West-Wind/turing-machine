import { PairMap } from "../structure/pair-map";
import { CommonNumbers, Vec2 } from "./math";

const VERTEX_RADIUS = 20;

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

export class StateVertex {
	readonly id: number;
	private position: Vec2;
	transitions: StateTransition[] = [];
	graph?: StateGraph;
	hovered: boolean;

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
		this.graph?.updateVertex(this.id);
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
}

export class StateEdge {
	private start: Vec2;
	private end: Vec2;
	private mid?: Vec2;
	private transitions: string[];

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

	addTransition(transition: string) {
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
		ctx.strokeStyle = "#fff";
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
		ctx.fillStyle = "#fff";
		ctx.fill();
		
		// draw text
		let offset: Vec2;
		let start: Vec2;
		if (!this.mid) {
			offset = this.end.subVec(this.start).scale(0.5);
			start = this.start;
		} else {
			const off1 = this.end.subVec(this.mid).scale(0.5), off2 = this.mid.subVec(this.start).scale(0.5);
			if (off1.magnitude > off2.magnitude) {
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
		ctx.fillText(this.transitions.join("\n"), pos.x, pos.y);

	}
}

class StateGraph {
	private vertices = new Map<number, StateVertex>();
	private edges = new PairMap<number, number, StateEdge>;

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
				edge.addTransition(trans.toEdgeString());
			}
		});
	}

	getVertex(id: number) {
		return this.vertices.get(id);
	}
	
	updateVertex(id: number) {
		const vertex = this.vertices.get(id);
		if (!vertex) return;
		this.edges.deleteA(vertex.id);
		vertex.transitions.forEach(trans => {
			const dest = this.vertices.get(trans.destination);
			if (dest) {
				let edge: StateEdge;
				if (this.edges.has(vertex.id, dest.id)) edge = this.edges.get(vertex.id, dest.id)!;
				else this.edges.set(vertex.id, dest.id, edge = new StateEdge(vertex.getPosition(), dest.getPosition()));
				edge.addTransition(trans.toEdgeString());
			}
		});
		this.edges.getB(id)?.forEach(edge => edge.setEnd(vertex.getPosition()));
	}

	drawEdges(ctx: CanvasRenderingContext2D) {
		this.edges.forEach(edge => {
			edge.draw(ctx);
		});
	}

	drawVertices(ctx: CanvasRenderingContext2D) {
		this.vertices.forEach(v => v.draw(ctx));
	}
	
	mouseTick(position: Vec2) {
		let hovered: number | undefined;
		for (const [id, vertex] of this.vertices.entries()) {
			if (hovered !== undefined || position.subVec(vertex.getPosition()).magnitude > VERTEX_RADIUS) vertex.hovered = false;
			else {
				vertex.hovered = true;
				hovered = id;
			}
		}
		return hovered;
	}
}

const graph = new StateGraph();
// testing
graph.addVertex(new StateVertex(2, new Vec2(200, 150)));
graph.addVertex(new StateVertex(1, new Vec2(100, 200)).addTransitions(new StateTransition(2, "a", "b", "L")));
export default graph;