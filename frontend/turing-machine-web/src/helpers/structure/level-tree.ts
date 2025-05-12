import { Level } from "../designer/level";
import { Vec2 } from "../designer/math";

const RADIUS = 20;
const MAX_ANGLE = Math.PI * 2 / 3;

export class LevelTree {
	private level?: Level;
	private children: LevelTree[] = [];
	private branches?: number[]; // angle (radian) for branches, 0 is vertical
	private hovered = false;
	private descriptionLines?: string[];

	static build(levels: Level[]) {
		const map = new Map<number, LevelTree>();
		let rootId: number | undefined;
		for (const level of levels) {
			let tree: LevelTree;
			if (map.has(level.LevelID)) {
				tree = map.get(level.LevelID)!;
				tree.level = level;
			} else {
				tree = new LevelTree(level);
				map.set(level.LevelID, tree);
			}

			if (level.ParentID !== 0) {
				let parentTree: LevelTree;
				if (!map.has(level.ParentID)) {
					parentTree = new LevelTree();
					map.set(level.ParentID, parentTree);
				} else parentTree = map.get(level.ParentID)!;
				parentTree.children.push(tree);
			} else rootId = level.LevelID;
		}
		return map.get(rootId!)!;
	}

	constructor(level?: Level) {
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
		ctx.globalAlpha = Math.max(0, (ctx.canvas.width * ctx.canvas.width * 0.02 - cursorPosition.subVec(position).magnitudeSqr()) / (ctx.canvas.width * ctx.canvas.width * 0.02));
		ctx.fillText(this.level?.Title || "", position.x, position.y - RADIUS * 1.2);
		ctx.globalAlpha = 1;

		// draw description if hovered
		if (this.hovered && this.level?.Descriptions) {
			ctx.fillStyle = "#444";

			if (this.descriptionLines === undefined) {
				let description = this.level.Descriptions;
				// Split description into lines
				this.descriptionLines = [];
				const punctuations = [". ", "! ", "? "];
				let indices = punctuations.map(punc => description.indexOf(punc)).filter(punc => punc >= 0);
				let min: number;
				while (indices.length && this.descriptionLines.length < 4) {
					min = indices.reduce((a, b) => Math.min(a, b));
					this.descriptionLines.push(description.slice(0, min) + description.slice(min, min + 1));
					description = description.slice(min + 2);
					indices = punctuations.map(punc => description.indexOf(punc)).filter(punc => punc >= 0);
				}
				if (this.descriptionLines.length >= 4) this.descriptionLines[3] = "...";
				else if (description) this.descriptionLines.push(description);
			}
			
			const width = this.descriptionLines.map(line => ctx.measureText(line).width).reduce((a, b) => Math.max(a, b));
			ctx.fillRect(cursorPosition.x - width / 2 - size / 2, cursorPosition.y + RADIUS - size / 2, width + size, size * (this.descriptionLines.length * 1.5 + 0.5));
			ctx.fillStyle = "#fff";
			ctx.textBaseline = "top";
			this.descriptionLines.forEach((line, ii) => {
				ctx.fillText(line, cursorPosition.x, cursorPosition.y + RADIUS + ii * size * 1.5);
			});
		}
		return this.branches;
	}

	isHovered() {
		return this.hovered;
	}
}