import React, { createRef, RefObject } from "react";

type Props = { height: number };

export default class DesignerGraph extends React.Component<Props> {
	ref: RefObject<HTMLCanvasElement | null>;
	observer?: ResizeObserver;

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

		ctx.fillStyle = "#232323";
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		ctx.fillStyle = "#fff";
		this.drawCircle(ctx, ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.height / 4);

		requestAnimationFrame(this.draw.bind(this));
	}

	private drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.fill();
	}

	render() {
		return <canvas ref={this.ref} className="designer-fill-flex" style={{ height: this.props.height * window.innerHeight }} />;
	}
}