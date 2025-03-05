import React, { createRef, RefObject } from "react";
import { Vec2 } from "../../helpers/designer/math";
import graph from "../../helpers/designer/graph";
import DesignerGraphControl from "./graph/control";

const RIGHT_CLICK = 2;

type Props = { height: number };

enum Buttons {
	NONE,
	TEXTBOX = "text",
	RECTANGLE = "crosshair",
}

export default class DesignerGraph extends React.Component<Props> {
	ref: RefObject<HTMLCanvasElement | null>;
	observer?: ResizeObserver;
	state: { cursor: string, buttonActive: Buttons };

	// canvas rendering properties
	position = Vec2.ZERO;
	cursorPosition = Vec2.ZERO;
	scale = 1;

	constructor(props: Props) {
		super(props);
		this.ref = createRef<HTMLCanvasElement>();
		this.state = { cursor: "grab", buttonActive: Buttons.NONE };
	}

	componentDidMount() {
		this.observer = new ResizeObserver(this.onCanvasResize.bind(this));
		const canvas = this.ref.current;
		if (canvas) {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			this.observer.observe(canvas);

			this.draw();
		}
	}

	componentWillUnmount() {
		if (this.observer) this.observer.disconnect();
	}

	private onCanvasResize() {
		const canvas = this.ref.current;
		if (canvas) {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
		}
	}

	private draw() {
		const ctx = this.ref.current?.getContext("2d");
		if (!ctx) return;

		// fill background
		ctx.fillStyle = "#232323";
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		// draw graph
		ctx.scale(this.scale, this.scale);
		ctx.translate(this.position.x, this.position.y);
		graph.drawEdges(ctx);
		graph.drawVertices(ctx);
		ctx.resetTransform();

		// draw overlays (pos, scale)
		ctx.fillStyle = "#fff";
		ctx.font = ` ${ctx.canvas.height / 30}px Courier New`;
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText(`Pos: ${this.position.toString()} Cur: ${this.cursorPosition.toString()} Zoom: ${Math.round(this.scale * 100)}%`, 10, 10);

		requestAnimationFrame(this.draw.bind(this));
	}

	// used to track grabbing
	private onMouseDown(ev: React.MouseEvent) {
		if (ev.button == RIGHT_CLICK) {
			this.setState({ cursor: "grabbing" });
			const startPos = new Vec2(ev.clientX, ev.clientY);
			const onMouseMove = (ev: MouseEvent) => {
				this.position = this.position.offset((ev.clientX - startPos.x) / this.scale, (ev.clientY - startPos.y) / this.scale);
			};

			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", () => {
				this.setState({ cursor: "grab" });
				this.position = this.position.finalize();
				window.removeEventListener("mousemove", onMouseMove);
			});
		}
	}

	// used to track cursor position
	private onMouseMove(ev: React.MouseEvent) {
		const canvas = this.ref.current;
		if (!canvas) return;
		const clientCursorPosition = new Vec2(ev.clientX - canvas.offsetLeft, ev.clientY - canvas.offsetTop);
		this.cursorPosition = clientCursorPosition.scale(1 / this.scale).subVec(this.position);
	}

	private onWheel(ev: React.WheelEvent) {
		const offset = this.position.inv().subVec(this.cursorPosition);
		this.position = this.position.addVec(offset.scale(1 / this.scale));
		this.scale -= ev.deltaY / 4000;
		this.position = this.position.subVec(offset.scale(1 / this.scale));
	}

	render() {
		const controlStateSetter = (button: Buttons) => (() => {
			this.setState({
				buttonActive: this.state.buttonActive != button ? button : Buttons.NONE,
				cursor: this.state.buttonActive == Buttons.NONE ? button : "grab"
			});
		});

		return <>
			<canvas
				ref={this.ref}
				className="designer-fill-flex"
				style={{ height: this.props.height * window.innerHeight, cursor: this.state.cursor }}
				onMouseDown={this.onMouseDown.bind(this)}
				onMouseMove={this.onMouseMove.bind(this)}
				onContextMenu={(e) => e.preventDefault()}
				onWheel={this.onWheel.bind(this)}
			/>
			<DesignerGraphControl
				text={this.state.buttonActive == Buttons.TEXTBOX}
				rect={this.state.buttonActive == Buttons.RECTANGLE}
				onText={controlStateSetter(Buttons.TEXTBOX)}
				onRect={controlStateSetter(Buttons.RECTANGLE)}
			/>
		</>;
	}
}