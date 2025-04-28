import { SimpleLevel } from "../designer/level";
import { Vec2 } from "../designer/math";

const RADIUS = 20;
const MAX_ANGLE = Math.PI * 2 / 3;

export class LevelTree {
	private level?: SimpleLevel;
	private children: LevelTree[] = [];
	private branches?: number[]; // angle (radian) for branches, 0 is vertical
	private hovered = false;

	static build(levels: SimpleLevel[]) {
		const map = new Map<string, LevelTree>();
		let rootId: string | undefined;
		for (const level of levels) {
			let tree: LevelTree;
			if (map.has(level.id)) {
				tree = map.get(level.id)!;
				tree.level = level;
			} else {
				tree = new LevelTree(level);
				map.set(level.id, tree);
			}

			if (level.parent) {
				let parentTree: LevelTree;
				if (!map.has(level.parent)) {
					parentTree = new LevelTree();
					map.set(level.parent, parentTree);
				} else parentTree = map.get(level.parent)!;
				parentTree.children.push(tree);
			} else rootId = level.id;
		}
		return map.get(rootId!)!;
	}

	constructor(level?: SimpleLevel) {
		this.level = level;
	}

	getDetail() {
		return this.level;
	}

	getChildren() {
		return this.children;
	}

	draw(ctx: CanvasRenderingContext2D, position: Vec2, cursorPosition: Vec2) {
		this.hovered = position.subVec(cursorPosition).magnitudeSqr() < RADIUS * RADIUS;

		// calculate branch angles
		if (!this.branches) {
			this.branches = [];
			const angleSlice = MAX_ANGLE / this.children.length;
			for (let ii = 0; ii < this.children.length; ii++) {
				const offset = ii - (this.children.length - 1) / 2;
				const baseAngle = angleSlice * offset;
				this.branches.push(baseAngle + Math.random() * 0.1 - 0.05);
			}
		}

		// draw branch
		ctx.strokeStyle = "#4d3d2a";
		ctx.lineWidth = ctx.canvas.width / 200;
		for (const branch of this.branches) {
			ctx.beginPath();
			ctx.moveTo(position.x, position.y);
			const next = position.sub(Math.tan(branch) * 0.2 * ctx.canvas.height, 0.2 * ctx.canvas.height);
			ctx.lineTo(next.x, next.y);
			ctx.stroke();
		}

		// draw node
		if (this.hovered) ctx.fillStyle = "#f5fff4";
		else ctx.fillStyle = "#a8f3a4";
		ctx.beginPath();
		ctx.arc(position.x, position.y, RADIUS, 0, Math.PI * 2);
		ctx.fill();

		// draw text
		ctx.fillStyle = "#fff";
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom";
		const size = ctx.canvas.height / 40;
		ctx.font = ` ${size}px Courier New`;
		ctx.fillText(this.level?.title || "", position.x, position.y - RADIUS * 1.2);

		// draw description if hovered
		if (this.hovered) {
			ctx.fillStyle = "#444";
			const width = ctx.measureText(this.level?.description || "").width;
			ctx.fillRect(cursorPosition.x - width / 2 - size / 2, cursorPosition.y + RADIUS - size / 2, width + size, size * 2);
			ctx.fillStyle = "#fff";
			ctx.textBaseline = "top";
			ctx.fillText(this.level?.description || "", cursorPosition.x, cursorPosition.y + RADIUS);
		}
		return this.branches;
	}

	isHovered() {
		return this.hovered;
	}
}