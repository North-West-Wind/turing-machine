import React, { createRef, RefObject } from "react";
import { Vec2 } from "../../helpers/designer/math";
import graph from "../../helpers/designer/graph";

type Props = { height: number };

export default class DesignerGraph extends React.Component<Props> {
	ref: RefObject<HTMLCanvasElement | null>;
	observer?: ResizeObserver;

	// canvas rendering properties
	position = Vec2.ZERO;

	constructor(props: Props) {
		super(props);
		this.ref = createRef<HTMLCanvasElement>();
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
		ctx.translate(this.position.x, this.position.y);
		graph.drawEdges(ctx);
		graph.drawVertices(ctx);
		ctx.resetTransform();

		// draw overlays (pos, scale)
		ctx.fillStyle = "#fff";
		ctx.font = ` ${ctx.canvas.height / 30}px Courier New`;
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText(`(${this.position.x}, ${this.position.y})`, 10, 10);

		requestAnimationFrame(this.draw.bind(this));
	}

	render() {
		return <canvas ref={this.ref} className="designer-fill-flex" style={{ height: this.props.height * window.innerHeight }} />;
	}
}