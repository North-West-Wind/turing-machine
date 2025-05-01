// May change to x, y instead of array
export type Saveable2DVector = [number, number];

export type SaveableTape = {
	type: string;
	value?: string;
	input?: boolean;
	output?: boolean;
}

export type SaveableTransitionStatement = {
	read: string;
	write: string;
	move: number;
}

export type SaveableTransition = {
	source: number;
	target: number;
	statements: SaveableTransitionStatement[];
	lines: Saveable2DVector[];
}

export type SaveableHead = {
	type: string; // r, w, rw
	tape: number;
	position: number;
}

export type SaveableUIBox = {
	start: Saveable2DVector;
	size: Saveable2DVector;
	color: number;
}

export type SaveableUIText = {
	pos: Saveable2DVector;
	value: string;
}

export type SaveableUIVertex = {
	label?: string;
	position: Saveable2DVector;
}

export type SaveableUI = {
	title?: string;
	color: number;
	boxes: (SaveableUIBox | null)[];
	texts: (SaveableUIText | null)[];
	nodes: (SaveableUIVertex | null)[];
}

export type SaveableMachine = {
	transitions: SaveableTransition[];
	heads: SaveableHead[];
	start: number;
	ui: SaveableUI;
}

export type SaveableTuringMachine = {
  tapes: (SaveableTape | null)[];
  machines: (SaveableMachine | null)[];
}