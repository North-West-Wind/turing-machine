import { Saveable2DVector } from "./machine";

export enum CommonNumbers {
	PI2 = Math.PI * 2
}

export class Vec2 {
	static readonly ZERO = new Vec2(0, 0);

	static fromSaveable(saveable: Saveable2DVector) {
		return new Vec2(saveable.x, saveable.y);
	}

	readonly x: number;
	readonly y: number;
	private readonly initX: number;
	private readonly initY: number;
	// square root is expensive, so we cache magnitude
	private mag?: number;

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

	magnitudeSqr() {
		return this.x * this.x + this.y * this.y;
	}

	magnitude() {
		if (this.mag !== undefined) return this.mag;
		return this.mag = Math.sqrt(this.magnitudeSqr());
	}

	withMagnitude(mag: number) {
		return this.scale(mag / this.magnitude());
	}

	perpendicular() {
		// in a top-right == quadrant 1 system, this turns it anti-clockwise by 90 degrees
		// on a computer screen where y-axis is flipped, this goes clockwise
		return new Vec2(-this.y, this.x);
	}

	unit() {
		return this.withMagnitude(1);
	}

	dot(vec: Vec2) {
		return this.x * vec.x + this.y * vec.y;
	}

	projectTo(vec: Vec2) {
		return vec.scale(this.dot(vec) / vec.magnitudeSqr());
	}

	offset(x: number, y: number) {
		return new Vec2(this.initX + x, this.initY + y, { x: this.initX, y: this.initY })
	}

	// can also be used as clone
	finalize() {
		return new Vec2(this.x, this.y);
	}

	isVertical() {
		return this.x == 0 && this.y != 0;
	}

	toString() {
		return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
	}

	toSaveable(): Saveable2DVector {
		return { x: this.x, y: this.y };
	}
}