import React, { useEffect, useRef, useState } from "react"
import { Level } from "../../helpers/designer/level"
import { LevelTree } from "../../helpers/structure/level-tree"
import { Vec2 } from "../../helpers/designer/math";
import { useNavigate } from "react-router-dom";

const LEFT_CLICK = 0;
const RIGHT_CLICK = 2;

// generate random ground
let points: Vec2[] = [];
for (let ii = 0; ii < Math.round(Math.random() * 7) + 8; ii++)
	points.push(new Vec2(Math.random(), Math.random()));
points = points.sort((a, b) => a.x - b.x);

// canvas properties
let position = Vec2.ZERO;
let cursorPosition = Vec2.ZERO;
let hovered: LevelTree | undefined;

export default function LevelTreeCanvas(props: { levels: Level[], open: (levelId?: number) => void }) {
	const [tree, setTree] = useState(LevelTree.build(props.levels));
	const [cursor, setCursor] = useState("");
	const ref = useRef<HTMLCanvasElement>(null);
	const navigate = useNavigate();

	useEffect(() => {
		setTree(LevelTree.build(props.levels));
	}, [props.levels]);

	useEffect(() => {
		let drawing = true;

		const draw = () => {
			if (!drawing) return;

			const ctx = ref.current?.getContext("2d");
			if (!ctx) return;

			// draw background
			ctx.fillStyle = "#0e203e";
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			// draw ground
			ctx.translate(0, position.y);
			ctx.fillStyle = "#0d362b";
			ctx.beginPath();
			ctx.moveTo(0, ctx.canvas.height - position.y);
			ctx.lineTo(0, (20 - points[0].y - 2) * ctx.canvas.height * 0.05);
			for (let ii = 1; ii < points.length - 1; ii++)
				ctx.lineTo(ctx.canvas.width * points[ii].x + position.x, (20 - points[ii].y - 2) * ctx.canvas.height * 0.05);
			ctx.lineTo(ctx.canvas.width, (20 - points[points.length - 1].y - 2) * ctx.canvas.height * 0.05);
			ctx.lineTo(ctx.canvas.width, ctx.canvas.height - position.y);
			ctx.fill();

			// draw tree
			ctx.translate(position.x, 0);
			const treeQueue = [{ tree, position: new Vec2(ctx.canvas.width / 2, 0.9 * ctx.canvas.height) }];
			let currentTree: { tree: LevelTree, position: Vec2 } | undefined;
			let hoveredTree: LevelTree | undefined;
			while (currentTree = treeQueue.shift()) {
				if (currentTree.tree.isHovered())
					hoveredTree = currentTree.tree;
				const branches = currentTree.tree.draw(ctx, currentTree.position, cursorPosition);
				currentTree.tree.getChildren().forEach((child, ii) => {
					treeQueue.push({ tree: child, position: currentTree!.position.sub(Math.tan(branches[ii]) * 0.2 * ctx.canvas.height, 0.2 * ctx.canvas.height) });
				});
			}
			hovered = hoveredTree;
			ctx.resetTransform();
			
			requestAnimationFrame(draw);
		};

		const resize = () => {
			const canvas = ref.current;
			if (canvas) {
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
			}
		};

		const canvas = ref.current;
		if (canvas) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;

			draw();
		}

		window.addEventListener("resize", resize);
		return () => {
			drawing = false;
			window.removeEventListener("resize", resize);
		}
	}, []);

	const onMouseDown = (ev: React.MouseEvent) => {
		if (ev.button == RIGHT_CLICK) {
			setCursor("grabbing");
			const startPos = new Vec2(ev.clientX, ev.clientY);
			const onMouseMove = (ev: MouseEvent) => {
				position = position.offset((ev.clientX - startPos.x), (ev.clientY - startPos.y));
			};

			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", () => {
				setCursor("");
				position = position.finalize();
				window.removeEventListener("mousemove", onMouseMove);
			}, { once: true });
		} else if (ev.button == LEFT_CLICK && hovered) {
			props.open(hovered.getDetail()?.LevelID);
		}
	};

	const onMouseMove = (ev: React.MouseEvent) => {
		cursorPosition = new Vec2(ev.clientX, ev.clientY).subVec(position);
	};

	const home = () => {
		navigate("/mode");
	};

	const reset = () => {
		position = Vec2.ZERO;
	};

	return <>
		<div className="level-graph-buttons">
			<div onClick={home}><img src="/ui/home.svg" /></div>
			<div onClick={reset}><img src="/graph/reset.svg" /></div>
		</div>
		<canvas
			ref={ref}
			onMouseDown={onMouseDown}
			onMouseMove={onMouseMove}
			onContextMenu={(e) => e.preventDefault()}
			style={{ cursor }}
		/>
	</>;
}