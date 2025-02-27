export enum CommonNumbers {
	PI2 = Math.PI * 2
}

export class Vec2 {
	static readonly ZERO = new Vec2(0, 0);

	readonly x: number;
	readonly y: number;
	private readonly initX: number;
	private readonly initY: number;

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

	offset(x: number, y: number) {
		return new Vec2(this.initX + x, this.initY + y, { x: this.initX, y: this.initY })
	}

	finalize() {
		return new Vec2(this.x, this.y);
	}
}