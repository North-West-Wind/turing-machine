import { CommonNumbers, Vec2 } from "./math";

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
}

export class StateVertex {
	id: number;
	position: Vec2;
	transitions: StateTransition[] = [];
	graph?: StateGraph;

	constructor(id: number, position: Vec2) {
		this.id = id;
		this.position = position;
	}

	addTransitions(...transitions: StateTransition[]) {
		this.transitions.push(...transitions);
		return this;
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = "#7f7f7f";
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, 20, 0, CommonNumbers.PI2);
		ctx.fill();

		ctx.fillStyle = "#fff";
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillText(this.id.toString(), this.position.x, this.position.y);
	}
}

export class StateEdge {
	private start: Vec2;
	private end: Vec2;
	private mid?: Vec2;

	constructor(start: Vec2, end: Vec2) {
		this.start = start;
		this.end = end;
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
			this.mid = new Vec2(this.start.y, this.end.x);
		else
			this.mid = undefined;
	}

	draw(ctx: CanvasRenderingContext2D) {
		ctx.strokeStyle = "#fff";
		ctx.beginPath();
		ctx.moveTo(this.start.x, this.start.y);
		if (this.mid) {
			// start and end are not axis-aligned. need to use mid-point
			ctx.lineTo(this.mid.x, this.mid.y);
		}
		ctx.lineTo(this.end.x, this.end.y);
		ctx.stroke();
	}
}

class StateGraph {
	private vertices = new Map<number, StateVertex>();
	private edges = new Map<number, StateEdge[]>;

	addVertex(vertex: StateVertex) {
		this.vertices.set(vertex.id, vertex);
		this.edges.set(vertex.id, []);
		vertex.transitions.forEach(trans => {
			const dest = this.vertices.get(trans.destination);
			if (dest) this.edges.get(vertex.id)?.push(new StateEdge(vertex.position, dest.position));
		});
	}

	drawEdges(ctx: CanvasRenderingContext2D) {
		this.edges.forEach(list => list.forEach(edge => edge.draw(ctx)));
	}

	drawVertices(ctx: CanvasRenderingContext2D) {
		this.vertices.forEach(v => v.draw(ctx));
	}
}

const graph = new StateGraph();
// testing
graph.addVertex(new StateVertex(2, new Vec2(200, 150)));
graph.addVertex(new StateVertex(1, new Vec2(100, 200)).addTransitions(new StateTransition(2, "a", "b", "L")));
export default graph;