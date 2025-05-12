import { ISaveable } from "./canvas";
import { Vec2 } from "./math";

export type SaveableTape = {
	Type: "Infinite" | "LeftLimited" | "RightLimited" | "LeftRightLimited" | "Circular";
	InitialValues: string;
}

export type SaveableTapeInfo = {
	InputTapes: number;
	OutputTapes: number;
	Tapes: SaveableTape[];
}

export type SaveableUILine = {
	Source: { X: number, Y: number };
	Steps: { StepX: number, StepY: number }[];
}

export type SaveableUIBox = {
	X: number;
	Y: number;
	Width: number;
	Height: number;
	Color: number;
}

export type SaveableUIText = {
	X: number;
	Y: number;
	Value: string;
}

export type SaveableUINode = {
	NodeID: number;
	X: number;
	Y: number;
	IsFinal: boolean;
}

export type SaveableUI = {
	Color: number;
	TransitionLines: SaveableUILine[];
	HighlightBoxes: SaveableUIBox[];
	TextLabels: SaveableUIText[];
	Nodes: SaveableUINode[];
}

export type SaveableLogicTransitionStatement = {
	TapeID: number;
	Read: string; // char
	Write: string; // char
	Move: number;
}

export type SaveableLogicTransition = {
	SourceNodeID: number;
	TargetNodeID: number;
	Statements: SaveableLogicTransitionStatement[];
}

export type SaveableLogicHead = {
	HeadOrderIndex: number;
	TapeID: number;
	Type: "Read" | "Write" | "ReadWrite";
	Position: number;
}

export type SaveableLogic = {
	Transitions: SaveableLogicTransition[];
	Heads: SaveableLogicHead[];
	StartNode: number;
}

export type SaveableMachine = {
	UI: SaveableUI;
	Machine: SaveableLogic;	
}

export type SaveableTuringMachine = {
	Author: string;

	TransitionCount: number;
	StateCount: number;
	HeadCount: number;
	TapeCount: number;
	OperationCount: number;

	TapeInfo: SaveableTapeInfo;

  Machine: SaveableMachine[];
}

export class ClientSaveableUI implements ISaveable<SaveableUI> {
	private static readonly MIN_ERROR = 0.0001;

	color: number;
	nodes: Map<number, SaveableUINode>;
	edges: Map<`${number}_${number}`, Vec2[]>;
	boxes: SaveableUIBox[];
	texts: SaveableUIText[];

	constructor(ui?: SaveableUI) {
		this.color = ui?.Color || 0;
		this.nodes = new Map();
		this.edges = new Map();
		this.boxes = ui?.HighlightBoxes || [];
		this.texts = ui?.TextLabels || [];

		if (ui) {
			ui.Nodes.forEach(node => this.nodes.set(node.NodeID, node));
			ui.TransitionLines.forEach(line => {
				const src = new Vec2(line.Source.X, line.Source.Y);
				let dest = src;
				const vectors: Vec2[] = [];
				for (const step of line.Steps) {
					vectors.push(new Vec2(step.StepX, step.StepY));
					dest = dest.add(step.StepX, step.StepY);
				}
				let startNode = -1, endNode = -1;
				ui.Nodes.forEach(node => {
					if (this.isSame(node.X, src.x) && this.isSame(node.Y, src.y)) startNode = node.NodeID;
					if (this.isSame(node.X, dest.x) && (node.Y == dest.y)) endNode = node.NodeID;
				});
	
				if (startNode >= 0 && endNode >= 0)
					this.edges.set(`${startNode}_${endNode}`, vectors);
			});
		}
	}

	private isSame(a: number, b: number) {
		return Math.abs(a - b) < ClientSaveableUI.MIN_ERROR;
	}

	toSaveable(): SaveableUI {
		return {
			Color: this.color,
			TransitionLines: Array.from(this.edges.entries()).map(([key, lines]) => {
				const [src] = key.split("_");
				const node = this.nodes.get(parseInt(src));
				if (!node) return undefined;
				return { Source: { X: node.X, Y: node.Y }, Steps: lines.map(line => ({ StepX: line.x, StepY: line.y })) };
			}).filter(lines => !!lines),
			HighlightBoxes: this.boxes,
			TextLabels: this.texts,
			Nodes: Array.from(this.nodes.values())
		}
	}
}