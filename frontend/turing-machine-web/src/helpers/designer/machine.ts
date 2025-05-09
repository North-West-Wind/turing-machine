// May change to x, y instead of array
export type Saveable2DVector = {
	x: number;
	y: number;
}

export type SaveableTape = {
	type: string;
	values?: string;
	isInput?: boolean;
	isOutput?: boolean;
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
	transitionLineSteps: Saveable2DVector[];
}

export type SaveableHead = {
	type: string; // Read, Write, ReadWrite
	tape: number;
	position: number;
}

export type SaveableUIBox = {
	start: Saveable2DVector;
	size: Saveable2DVector;
	color: number;
}

export type SaveableUIText = {
	position: Saveable2DVector;
	value: string;
}

export type SaveableUIVertex = {
	label?: string;
	position: Saveable2DVector;
	isFinal: boolean;
}

export type SaveableUI = {
	title?: string;
	color: number;
	boxes: (SaveableUIBox | {})[];
	texts: (SaveableUIText | {})[];
	nodes: (SaveableUIVertex | {})[];
}

export type ClientSaveableUI = {
	title?: string;
	color: number;
	boxes: (SaveableUIBox | null)[];
	texts: (SaveableUIText | null)[];
	nodes: (SaveableUIVertex | null)[];
}

export type SaveableMachine = {
	transitions: SaveableTransition[];
	heads: SaveableHead[];
	startNode: number;
	label: SaveableUI;
}

export type SaveableTuringMachine = {
  tapes: SaveableTape[];
  machines: SaveableMachine[];
}