import { Vec2 } from "./math";

export interface IDrawable {
	draw(ctx: CanvasRenderingContext2D, scale: number): void;
}

export interface IDrawableOverlay {
	drawOverlay(ctx: CanvasRenderingContext2D, mousePosition: Vec2): void;
}

export interface IHoverable {
	hovered: boolean;

	isHovered(position: Vec2, scale: number): boolean;
}

export interface ISaveable<T> {
	toSaveable(): T;
}