import { TapeTypes } from "../../logic/Tapes/TapeTypes";
import { SaveableTuringMachine } from "./machine";
import simulator from "./simulator";

export type LevelTest = {
	input: string;
	output: string;
}

export type RangeContraints = {
	min?: number;
	max?: number;
}

export type LevelContraints = {
	states?: RangeContraints;
	transitions?: RangeContraints;
	tapes?: RangeContraints;
	heads?: RangeContraints;
	tapeTypes?: ("Infinite" | "LeftLimited" | "RightLimited" | "LeftRightLimited" | "Circular")[];
}

export type DetailedLevel = {
	levelID: number;
	title: string;
	description: string;
	parents: number[];
	children: number[];
	testCases: LevelTest[];
	constraints: LevelContraints;
	isSolved: boolean;
	design?: SaveableTuringMachine;
	operations: number;
}

export type SimpleLevel = {
	levelID: number;
	title: string;
	description: string;
	parent?: number;
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
		if (range.min !== undefined && val < range.min) return [-1, range.min, range.max === undefined ? Infinity : range.max];
		if (range.max !== undefined && val > range.max) return [1, range.min === undefined ? Infinity : range.min, range.max];
		return [0];
	}

	rangeConstraintMessage(name: string, min: number, max: number) {
		return `Amount of ${name} is not within constraints [${min}, ${max}]`;
	}
}
const constraints = new ConstraintHandler();
export default constraints;