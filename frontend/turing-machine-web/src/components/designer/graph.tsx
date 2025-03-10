import React, { useEffect, useRef, useState } from "react";
import { Vec2 } from "../../helpers/designer/math";
import graph, { Hovered, StateRect } from "../../helpers/designer/graph";
import DesignerGraphControl from "./graph/control";

const LEFT_CLICK = 0;
const RIGHT_CLICK = 2;
const DOUBLE_CLICK_WINDOW = 300; // 300 ms

enum Buttons {
	NONE,
	TEXTBOX = "text",
	RECTANGLE = "crosshair",
}

// canvas rendering properties
let position = Vec2.ZERO;
let cursorPosition = Vec2.ZERO;
let scale = 1;

// movement logic properties
let hovered: Hovered | undefined;
let grabbed: Hovered | undefined;
let lastGrabbed = { time: Date.now(), hovered: undefined as (typeof grabbed) };

export default function DesignerGraph(props: { width: number, height: number }) {
	const ref = useRef<HTMLCanvasElement>(null);
	const [cursor, setCursor] = useState("grab");
	const [buttonActive, setButtonActive] = useState(Buttons.NONE);

	useEffect(() => {
		// reset properties outside function
		position = cursorPosition = Vec2.ZERO;
		scale = 1;
		hovered = grabbed = undefined;
		lastGrabbed = { time: Date.now(), hovered: undefined as (typeof grabbed) };
	}, []);

	useEffect(() => {
		const canvas = ref.current;
		if (canvas) {
			canvas.width = props.width * window.innerWidth;
			canvas.height = props.height * window.innerHeight;
		}
	}, [props.width, props.height]);

	useEffect(() => {
		const draw = () => {
			const ctx = ref.current?.getContext("2d");
			if (!ctx) return;
	
			// fill background
			ctx.fillStyle = "#232323";
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			
			// draw graph
			ctx.scale(scale, scale);
			ctx.translate(position.x, position.y);
			graph.draw(ctx);
			ctx.resetTransform();
	
			// draw overlays (pos, scale)
			graph.drawOverlay(ctx, cursorPosition);
			ctx.fillStyle = "#fff";
			ctx.font = ` ${ctx.canvas.height / 30}px Courier New`;
			ctx.textAlign = "left";
			ctx.textBaseline = "top";
			ctx.fillText(`Pos: ${position.toString()} Cur: ${cursorPosition.toString()} Zoom: ${Math.round(scale * 100)}%`, 10, 10);
	
			requestAnimationFrame(draw);
		};

		const canvas = ref.current;
		if (canvas) {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;

			draw();
		}
	}, []);

	// used to track grabbing
	const onMouseDown = (ev: React.MouseEvent) => {
		if (ev.button == RIGHT_CLICK) {
			setCursor("grabbing");
			const startPos = new Vec2(ev.clientX, ev.clientY);
			const onMouseMove = (ev: MouseEvent) => {
				position = position.offset((ev.clientX - startPos.x) / scale, (ev.clientY - startPos.y) / scale);
			};

			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", () => {
				setCursor("grab");
				position = position.finalize();
				window.removeEventListener("mousemove", onMouseMove);
			}, { once: true });
		} else if (ev.button == LEFT_CLICK) {
			if (hovered !== undefined) {
				if (hovered.type == "vertex") {
					// vertex click handler
					setCursor("grabbing");
					grabbed = hovered;
					// when mouse moves, set the vertex position to the cursor position
					const onMouseMove = () => {
						if (grabbed)
							graph.getVertex(grabbed.id)?.setPosition(cursorPosition);
					};
	
					window.addEventListener("mousemove", onMouseMove);
					window.addEventListener("mouseup", () => {
						setCursor("grab");
						window.removeEventListener("mousemove", onMouseMove);
						// check for double click
						if (Date.now() - lastGrabbed.time <= DOUBLE_CLICK_WINDOW && lastGrabbed.hovered == grabbed) {
							// if double-clicked, send a custom event to simulation.tsx
							window.dispatchEvent(new CustomEvent("tm:edit", { detail: grabbed }));
						}
						lastGrabbed.time = Date.now();
						lastGrabbed.hovered = grabbed;
					}, { once: true });
				} else if (hovered.type == "rect") {
					// rect click handler
					setCursor("grabbing");
					grabbed = hovered;
					window.addEventListener("mouseup", () => {
						// check for double click
						if (Date.now() - lastGrabbed.time <= DOUBLE_CLICK_WINDOW && lastGrabbed.hovered == grabbed) {
							// if double-clicked, send a custom event to simulation.tsx
							window.dispatchEvent(new CustomEvent("tm:edit", { detail: grabbed }));
						}
						lastGrabbed.time = Date.now();
						lastGrabbed.hovered = grabbed;
					}, { once: true });
				}
			} else if (buttonActive == Buttons.RECTANGLE) {
				// draw a rectangle
				const rect = new StateRect(cursorPosition, cursorPosition, Math.floor(16777216 * Math.random()));
				graph.addRect(rect);
				// when mouse moves, set the rectangle end position to the cursor position
				const onMouseMove = () => {
					rect.setEnd(cursorPosition);
				};

				window.addEventListener("mousemove", onMouseMove);
				window.addEventListener("mouseup", () => {
					window.removeEventListener("mousemove", onMouseMove);
				});
			}
		}
	};

	// used to track cursor position
	const onMouseMove = (ev: React.MouseEvent) => {
		const canvas = ref.current;
		if (!canvas) return;
		const clientCursorPosition = new Vec2(ev.clientX - canvas.offsetLeft, ev.clientY - canvas.offsetTop);
		cursorPosition = clientCursorPosition.scale(1 / scale).subVec(position);
		hovered = graph.mouseTick(cursorPosition, scale);
	};

	const onWheel = (ev: React.WheelEvent) => {
		const offset = position.inv().subVec(cursorPosition);
		position = position.addVec(offset.scale(1 / scale));
		scale -= ev.deltaY / 4000;
		position = position.addVec(offset.scale(1 / scale));
	};

	const controlStateSetter = (button: Buttons) => (() => {
		setButtonActive(buttonActive != button ? button : Buttons.NONE);
		setCursor(buttonActive == Buttons.NONE ? button as string : "grab");
	});

	return <>
		<canvas
			ref={ref}
			className="designer-fill-flex"
			style={{ height: props.height * window.innerHeight, cursor }}
			onMouseDown={onMouseDown}
			onMouseMove={onMouseMove}
			onContextMenu={(e) => e.preventDefault()}
			onWheel={onWheel}
		/>
		<DesignerGraphControl
			text={buttonActive == Buttons.TEXTBOX}
			rect={buttonActive == Buttons.RECTANGLE}
			onText={controlStateSetter(Buttons.TEXTBOX)}
			onRect={controlStateSetter(Buttons.RECTANGLE)}
		/>
	</>;
}