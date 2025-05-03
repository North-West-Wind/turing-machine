import { TapeTypes } from "../../logic/Tapes/TapeTypes";
import { SaveableTuringMachine } from "./machine";
import simulator from "./simulator";

export type LevelTest = {
	input: string;
	output: string;
}

export type RangeContraints = {
	min: number;
	max: number;
}

export type LevelContraints = {
	states?: RangeContraints;
	transitions?: RangeContraints;
	tapes?: RangeContraints;
	heads?: RangeContraints;
	tapeTypes?: ("infinite" | "left-limited" | "right-limited" | "left-right-limited" | "circular")[];
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
	machine?: SaveableTuringMachine;
}

export type SimpleLevel = {
	id: string;
	title: string;
	description: string;
	parent?: string;
}

// A state to store the constraints of level
class ConstraintHandler {
	constraints: LevelContraints | undefined;

	constructor(constraints?: LevelContraints) {
		this.constraints = constraints;
	}

	loadConstraints(constraints?: LevelContraints) {
		this.constraints = constraints;
	}

	defaultTapeType() {
		if (!this.constraints?.tapeTypes?.length) return TapeTypes.Infinite;
		return simulator.tapeTypeFromString(this.constraints.tapeTypes[0])!;
	}

	validTapeType(type: TapeTypes) {
		if (!this.constraints?.tapeTypes?.length) return true;
		return this.constraints.tapeTypes.some(tt => tt == simulator.tapeTypeToString(type).toLowerCase());
	}

	availableTapeTypes() {
		if (!this.constraints?.tapeTypes?.length) return [TapeTypes.Infinite, TapeTypes.LeftLimited, TapeTypes.RightLimited, TapeTypes.LeftRightLimited, TapeTypes.Circular];
		return this.constraints.tapeTypes.map(type => simulator.tapeTypeFromString(type)).filter(type => type !== undefined);
	}

	validRange(val: number, range: RangeContraints) {
		if (val < range.min) return [-1, range.min, range.max];
		if (val > range.max) return [1, range.min, range.max];
		return [0];
	}

	rangeConstraintMessage(name: string, min: number, max: number) {
		return `Amount of ${name} is not within constraints [${min}, ${max}]`;
	}
}
const constraints = new ConstraintHandler();
export default constraints;