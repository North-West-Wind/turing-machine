export enum CommonNumbers {
	PI2 = Math.PI * 2
}

export class Vec2 {
	static readonly ZERO = new Vec2(0, 0);

	readonly x: number;
	readonly y: number;
	private readonly initX: number;
	private readonly initY: number;
	readonly magnitude: number;

	constructor(x: number, y: number, init?: { x: number, y: number }) {
		this.x = x;
		this.y = y;
		if (init) {
			this.initX = init.x;
			this.initY = init.y;
		} else {
			this.initX = x;
			this.initY = y;
		}
		this.magnitude = Math.sqrt(x * x + y * y);
	}

	add(x: number, y: number): Vec2 {
		return new Vec2(this.x + x, this.y + y);
	}

	addVec(vec: Vec2) {
		return this.add(vec.x, vec.y);
	}

	sub(x: number, y: number) {
		return this.add(-x, -y);
	}

	subVec(vec: Vec2) {
		return this.sub(vec.x, vec.y);
	}

	inv() {
		return this.scale(-1);
	}

	scale(x: number, y?: number) {
		if (y === undefined) y = x;
		return new Vec2(this.x * x, this.y * y);
	}

	withMagnitude(mag: number) {
		return this.scale(mag / this.magnitude);
	}

	perpendicular() {
		// in a top-right == quadrant 1 system, this turns it anti-clockwise by 90 degrees
		// on a computer screen where y-axis is flipped, this goes clockwise
		return new Vec2(-this.y, this.x);
	}

	offset(x: number, y: number) {
		return new Vec2(this.initX + x, this.initY + y, { x: this.initX, y: this.initY })
	}

	finalize() {
		return new Vec2(this.x, this.y);
	}

	toString() {
		return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
	}
}