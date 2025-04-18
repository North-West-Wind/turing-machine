export type LevelTest = {
	input: string;
	output: string;
}

export type RangeContraints = {
	min: number;
	max: number;
}

export type LevelContraints = {
	states: RangeContraints;
	transitions: RangeContraints;
	tapes: RangeContraints;
	heads: RangeContraints;
	tapeTypes: string[];
}

export type DetailedLevel = {
	id: string;
	title: string;
	description: string;
	parent: string;
	children: string[];
	tests: LevelTest[];
	constraints: LevelContraints;
	solved: boolean;
	machine: {}; // TODO: create machine object
}