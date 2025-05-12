import { TapeTypes } from "../../logic/Tapes/TapeTypes";

export type LevelTest = {
	Input: string;
	Output: string;
}

export type LevelContraints = {
	MinState?: number;
	MaxState?: number;
	MinTransition?: number;
	MaxTransition?: number;
	MinHead?: number;
	MaxHead?: number;
	MinTape?: number;
	MaxTape?: number;

	AllowInfinite: boolean;
	AllowLeftLimited: boolean;
	AllowRightLimited: boolean;
	AllowLeftRightLimited: boolean;
	AllowCircular: boolean;
}

export type Level = {
	LevelID: number;
	Title: string;
	Descriptions: string;

	ParentID: number;
	ChildrenID: number[];

	Testcases: LevelTest[];
	Constraint: LevelContraints;

	MinTransitionCount: number;
	MinStateCount: number;
	MinHeadCount: number;
	MinTapeCount: number;
	MinOperationCount: number;

	MaxTransitionCount: number;
	MaxStateCount: number;
	MaxHeadCount: number;
	MaxTapeCount: number;
	MaxOperationCount: number;
}

export type RangeValidation = [number, number, number];

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
		if (!this.constraints) return TapeTypes.Infinite;
		return this.availableTapeTypes()[0];
	}

	validTapeType(type: TapeTypes) {
		if (!this.constraints) return true;
		return this.availableTapeTypes().some(tt => tt == type);
	}

	availableTapeTypes() {
		if (!this.constraints) return [TapeTypes.Infinite, TapeTypes.LeftLimited, TapeTypes.RightLimited, TapeTypes.LeftRightLimited, TapeTypes.Circular];
		const types: TapeTypes[] = [];
		if (this.constraints.AllowInfinite) types.push(TapeTypes.Infinite);
		if (this.constraints.AllowLeftLimited) types.push(TapeTypes.LeftLimited);
		if (this.constraints.AllowRightLimited) types.push(TapeTypes.RightLimited);
		if (this.constraints.AllowLeftRightLimited) types.push(TapeTypes.LeftRightLimited);
		if (this.constraints.AllowCircular) types.push(TapeTypes.Circular);
		return types;
	}

	validStateRange(val: number): RangeValidation {
		const min = this.constraints?.MinState ?? -Infinity;
		const max = this.constraints?.MaxState ?? Infinity;
		if (val < min) return [-1, min, max];
		if (val > max) return [1, min, max];
		return [0, -Infinity, Infinity];
	}

	validTransitionRange(val: number): RangeValidation {
		const min = this.constraints?.MinTransition ?? -Infinity;
		const max = this.constraints?.MaxTransition ?? Infinity;
		if (val < min) return [-1, min, max];
		if (val > max) return [1, min, max];
		return [0, -Infinity, Infinity];
	}

	validHeadRange(val: number): RangeValidation {
		const min = this.constraints?.MinHead ?? -Infinity;
		const max = this.constraints?.MaxHead ?? Infinity;
		if (val < min) return [-1, min, max];
		if (val > max) return [1, min, max];
		return [0, -Infinity, Infinity];
	}

	validTapeRange(val: number): RangeValidation {
		const min = this.constraints?.MinTape ?? -Infinity;
		const max = this.constraints?.MaxTape ?? Infinity;
		if (val < min) return [-1, min, max];
		if (val > max) return [1, min, max];
		return [0, -Infinity, Infinity];
	}

	rangeConstraintMessage(name: string, min: number, max: number) {
		return `Amount of ${name} is not within constraints [${min == -Infinity ? "-inf" : min}, ${max == Infinity ? "inf" : max}]`;
	}
}
const constraints = new ConstraintHandler();
export default constraints;