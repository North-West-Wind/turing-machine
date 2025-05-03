import React, { useEffect, useRef, useState } from "react";
import { Vec2 } from "../../helpers/designer/math";
import { StateEdge, StateGraph, StateRect, StateText } from "../../helpers/designer/graph";
import DesignerGraphControl from "./graph/control";
import simulator, { Editable, TuringMachineEvent } from "../../helpers/designer/simulator";
import { SystemState } from "../../logic/SystemState";

const LEFT_CLICK = 0;
const RIGHT_CLICK = 2;
const DOUBLE_CLICK_WINDOW = 300; // 300 ms

enum Buttons {
	NONE,
	TEXTBOX = "text",
	RECTANGLE = "crosshair",
	EDGE = "grab"
}

// canvas rendering properties
let machineId: number | undefined;
let graph: StateGraph | undefined;
let position = Vec2.ZERO;
let cursorPosition = Vec2.ZERO; // cursor pos relative to translation
let mousePosition = Vec2.ZERO; // cursor pos relative to window
let scale = 1;
let bottomRightText = { text: "", time: 0 };

// movement logic properties
let hovered: Editable | undefined;
let grabbed: Editable | undefined;
let lastGrabbed = { time: Date.now(), hovered: undefined as (typeof grabbed) };

// specific editing properties
let creatingEdge: StateEdge | undefined;

// canvas images
let moveImage = new Image();
let zoomImage = new Image();
let cursorImage = new Image();
moveImage.src = "/graph/info/move.svg";
zoomImage.src = "/graph/info/zoom.svg";
cursorImage.src = "/graph/info/cursor.svg";

export default function DesignerGraph(props: { width: number, height: number, status?: string, save: () => void }) {
	const ref = useRef<HTMLCanvasElement>(null);
	const [cursor, setCursor] = useState("grab");
	const [buttonActive, setButtonActive] = useState(Buttons.NONE);

	useEffect(() => {
		// reset properties outside function
		position = cursorPosition = Vec2.ZERO;
		scale = 1;
		hovered = grabbed = undefined;
		lastGrabbed = { time: Date.now(), hovered: undefined as (typeof grabbed) };

		const onTmChangeMachine = (ev: CustomEventInit<number>) => {
			if (ev.detail !== undefined) {
				machineId = ev.detail;
				graph = simulator.getMachineGraph(ev.detail);
			}
		};

		const onTmStep = (ev: CustomEventInit<SystemState>) => {
			if (!ev.detail) return;
			const machine = ev.detail.Machines.find(machine => machine.ID == machineId);
			if (!machine) return;
			graph?.setCurrentState(machine.CurrentState);
		};

		simulator.addEventListener(TuringMachineEvent.CHANGE_MACHINE, onTmChangeMachine);
		simulator.addEventListener(TuringMachineEvent.STEP, onTmStep);
		return () => {
			simulator.removeEventListener(TuringMachineEvent.CHANGE_MACHINE, onTmChangeMachine);
			simulator.removeEventListener(TuringMachineEvent.STEP, onTmStep);
			bottomRightText = { text: "", time: 0 };
		};
	}, []);

	useEffect(() => {
		const canvas = ref.current;
		if (canvas) {
			canvas.width = props.width * window.innerWidth;
			canvas.height = props.height * window.innerHeight;
		}
	}, [props.width, props.height]);

	useEffect(() => {
		let drawing = true;
		let lastDraw = Date.now();

		const draw = () => {
			if (!drawing) return;
			const ctx = ref.current?.getContext("2d");
			if (!ctx) return;

			const now = Date.now();
			const elapsed = now - lastDraw;
			lastDraw = now;
	
			// fill background
			ctx.fillStyle = "#232323";
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			
			// draw graph
			ctx.scale(scale, scale);
			ctx.translate(position.x, position.y);
			graph?.draw(ctx);
			ctx.resetTransform();
	
			// draw overlays (pos, scale)
			if (graph) graph.drawOverlay(ctx, mousePosition);
			else {
				ctx.fillStyle = "#fff";
				ctx.font = `${ctx.canvas.height / 20}px Courier New`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText("Select/Add a machine to start!", ctx.canvas.width / 2, ctx.canvas.height / 2);
			}

			const infoSize = ctx.canvas.height / 30;
			ctx.font = `${infoSize * 0.5}px Courier New`;
			ctx.textAlign = "left";
			ctx.textBaseline = "middle";
			if (moveImage.complete) ctx.drawImage(moveImage, infoSize * 0.5, ctx.canvas.height - infoSize * 3.5, infoSize, infoSize);
			if (zoomImage.complete) ctx.drawImage(zoomImage, infoSize * 0.5, ctx.canvas.height - infoSize * 2.5, infoSize, infoSize);
			if (cursorImage.complete) ctx.drawImage(cursorImage, infoSize * 0.5, ctx.canvas.height - infoSize * 1.5, infoSize, infoSize);
			ctx.fillStyle = "#f8e45c";
			ctx.fillText(position.inv().toString(), infoSize * 2, ctx.canvas.height - infoSize * 3);
			ctx.fillStyle = "#57e389";
			ctx.fillText(`${Math.round(scale * 100)}%`, infoSize * 2, ctx.canvas.height - infoSize * 2);
			ctx.fillStyle = "#62a0ea";
			ctx.fillText(cursorPosition.toString(), infoSize * 2, ctx.canvas.height - infoSize);

			// draw status text
			if (bottomRightText.text && bottomRightText.time) {
				ctx.fillStyle = "#fff";
				ctx.font = `${ctx.canvas.height / 30}px Courier New`;
				ctx.textAlign = "right";
				ctx.textBaseline = "bottom";
				ctx.globalAlpha = bottomRightText.time > 1000 ? 1 : Math.max(0, bottomRightText.time / 1000);
				ctx.fillText(bottomRightText.text, ctx.canvas.width * 0.99, ctx.canvas.height - ctx.canvas.width * 0.01);
				ctx.globalAlpha = 1;
				bottomRightText.time -= elapsed;
				if (bottomRightText.time <= 0)
					bottomRightText = { text: "", time: 0 };
			}

			requestAnimationFrame(draw);
		};

		const canvas = ref.current;
		if (canvas) {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;

			draw();
		}

		return () => {
			drawing = false;
		}
	}, []);

	useEffect(() => {
		if (!props.status) return;
		bottomRightText = { text: props.status, time: 3000 };
	}, [props.status]);

	// used to track grabbing
	const onMouseDown = (ev: React.MouseEvent) => {
		if (!graph) return;
		if (ev.button == RIGHT_CLICK) {
			setCursor("grabbing");
			const startPos = new Vec2(ev.clientX, ev.clientY);
			const onMouseMove = (ev: MouseEvent) => {
				position = position.offset((ev.clientX - startPos.x) / scale, (ev.clientY - startPos.y) / scale);
			};

			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", () => {
				if (creatingEdge) {
					creatingEdge = undefined;
					graph?.discardTmpEdge();
				}
				setCursor("grab");
				position = position.finalize();
				window.removeEventListener("mousemove", onMouseMove);
			}, { once: true });
		} else if (ev.button == LEFT_CLICK) {
			if (buttonActive == Buttons.RECTANGLE) {
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
			} else if (buttonActive == Buttons.TEXTBOX) {
				// add a textbox
				const res = prompt("String for the textbox:");
				if (res) {
					const text = new StateText(res, cursorPosition);
					graph.addText(text);
				}
			} else if (buttonActive == Buttons.EDGE) {
				// create edge
				if (hovered !== undefined && hovered.type == "vertex") {
					if (creatingEdge) {
						// we reached the destination
						graph.finalizeTmpEdge(hovered.id);
						creatingEdge = undefined;
					} else {
						// starting off
						creatingEdge = graph.createTmpEdge(hovered.id, cursorPosition) || undefined;
					}
				} else if (creatingEdge) {
					creatingEdge.commitLine();
				}
			} else if (hovered !== undefined) {
				const setupMouseUp = (extra?: () => void) => {
					window.addEventListener("mouseup", () => {
						if (extra) extra();
						setCursor("grab");
						// check for double click
						if (Date.now() - lastGrabbed.time <= DOUBLE_CLICK_WINDOW && lastGrabbed.hovered == grabbed) {
							// if double-clicked, send a custom event to simulation.tsx
							simulator.dispatchEditEvent(grabbed);
						}
						lastGrabbed.time = Date.now();
						lastGrabbed.hovered = grabbed;
					}, { once: true });
				}
				if (hovered.type == "vertex") {
					// vertex click handler
					setCursor("grabbing");
					grabbed = hovered;
					// when mouse moves, set the vertex position to the cursor position
					const onMouseMove = () => {
						if (grabbed) {
							graph?.getVertex(grabbed.id)?.setPosition(cursorPosition);
							simulator.dispatchPropertiesUpdateEvent();
						}
					};
	
					window.addEventListener("mousemove", onMouseMove);
					setupMouseUp(() => window.removeEventListener("mousemove", onMouseMove));
				} else if (hovered.type == "rect") {
					// rect click handler
					setCursor("grabbing");
					grabbed = hovered;
					graph?.getRect(grabbed.id)?.setMovingCorner(true);

					const onMouseMove = () => {
						if (grabbed) {
							graph?.getRect(grabbed.id)?.moveCornerTo(cursorPosition);
							simulator.dispatchPropertiesUpdateEvent();
						}
					};
					window.addEventListener("mousemove", onMouseMove);
					setupMouseUp(() => {
						window.removeEventListener("mousemove", onMouseMove);
						if (grabbed)
							graph?.getRect(grabbed.id)?.setMovingCorner(false);
					});
				} else if (hovered.type == "text") {
					// textbox click handler
					setCursor("grabbing");
					grabbed = hovered;
					// when mouse moves, set the textbox position to the cursor position
					const onMouseMove = () => {
						if (grabbed) {
							graph?.getText(grabbed.id)?.setPosition(cursorPosition);
							simulator.dispatchPropertiesUpdateEvent();
						}
					};
	
					window.addEventListener("mousemove", onMouseMove);
					setupMouseUp(() => window.removeEventListener("mousemove", onMouseMove));
				}
			}
		}
	};

	// used to track cursor position
	const onMouseMove = (ev: React.MouseEvent) => {
		const canvas = ref.current;
		if (!canvas) return;
		mousePosition = new Vec2(ev.clientX - canvas.offsetLeft, ev.clientY - canvas.offsetTop);
		cursorPosition = mousePosition.scale(1 / scale).subVec(position);
		hovered = graph?.mouseTick(cursorPosition, scale);

		// handle edge creation
		if (creatingEdge)
			creatingEdge.setEnd(cursorPosition);
	};

	const onWheel = (ev: React.WheelEvent) => {
		const canvas = ref.current;
		if (!canvas) return;

		const oldScale = scale;
		scale -= ev.deltaY / 4000;
		scale = Math.max(0.01, Math.min(50, scale));
		position = position.subVec(cursorPosition.addVec(position).scale(1 - oldScale / scale));

		mousePosition = new Vec2(ev.clientX - canvas.offsetLeft, ev.clientY - canvas.offsetTop);
		cursorPosition = mousePosition.scale(1 / scale).subVec(position);
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
			buttons={{
				add: false,
				edge: buttonActive == Buttons.EDGE,
				text: buttonActive == Buttons.TEXTBOX,
				rect: buttonActive == Buttons.RECTANGLE,
				reset: false,
				save: false,
			}}
			on={key => {
				switch (key) {
					case "add": {
						if (!ref.current || !graph) break;
						graph.createVertex(position.add(ref.current.width * 0.5 / scale, ref.current.height * 0.5 / scale));
						break;
					}
					case "edge": {
						if (buttonActive == Buttons.EDGE) {
							creatingEdge = undefined;
							graph?.discardTmpEdge();
						}
						controlStateSetter(Buttons.EDGE)();
						break;
					}
					case "text": {
						controlStateSetter(Buttons.TEXTBOX)();
						break;
					}
					case "rect": {
						controlStateSetter(Buttons.RECTANGLE)();
						break;
					}
					case "reset": {
						position = Vec2.ZERO;
						scale = 1;
						break;
					}
					case "save": {
						props.save();
						break;
					}
				}
			}}
		/>
	</>;
}