export enum CommonNumbers {
	PI2 = Math.PI * 2
}

export class Vec2 {
	static readonly ZERO = new Vec2(0, 0);

	readonly x: number;
	readonly y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}