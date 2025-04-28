import { HeadTypes } from "../../logic/Heads/HeadTypes";
import { SystemState } from "../../logic/SystemState";
import { TapeConfig } from "../../logic/Tapes/TapesUtilities/TapeConfig";
import { TapeTypes } from "../../logic/Tapes/TapeTypes";
import { TuringMachineConfig } from "../../logic/TuringMachineConfig";
import { TuringMachineSimulator } from "../../logic/TuringMachineSimulator";
import { StateGraph, StateTransition, StateVertex } from "./graph";
import { Vec2 } from "./math";

export type Editable = {
	type: "vertex" | "rect" | "text" | "machine",
	id: number
}

export enum TuringMachineEvent {
	START = "tm:start",
	STEP = "tm:step",
	STOP = "tm:stop",
	HALT = "tm:halt",
	RESET = "tm:reset",
	EDIT = "tm:edit",
	CHANGE_MACHINE = "tm:change-machine",
	CHANGE_MACHINE_LENGTH = "tm:change-machine-length",
	CHANGE_TAPE = "tm:change-tape",
	CHANGE_TAPE_LENGTH = "tm:change-tape-length",
	CHANGE_INPUT_TAPE = "tm:change-input-tape",
	CHANGE_OUTPUT_TAPE = "tm:change-output-tape",
	PROPERTIES_UPDATE = "tm:prop-update",
}

export type Tape = {
	content?: string;
	type?: TapeTypes;
	id: number;
	left: number;
	right: number;
}

class RenderingTuringMachineSimulator extends EventTarget {
	private machines: ((TuringMachineConfig & { color: string, label?: string }) | null)[] = [];
	private tapes: (TapeConfig | null)[] = [];
	private graphs: (StateGraph | null)[] = [];
	private tickInterval = 1000; // milliseconds
	private paused = false;
	running = false;
	
	private inputTape = -1;
	private outputTape = -1;
	private state?: SystemState;

	constructor() {
		super();
		// Always 2 tapes: Input and Output
		//this.addTape(new TapeConfig(TapeTypes.Infinite, 0, ""));
		//this.addTape(new TapeConfig(TapeTypes.Infinite, 0, ""));
	}
	
	// Category: Pre-simulation

	getMachineGraph(id: number) {
		if (!this.machines[id]) throw new Error(`Machine with ID ${id} doesn't exist`);
		if (this.graphs[id]) return this.graphs[id];
		const graph = new StateGraph();
		// Transition is always more than vertices
		// More efficient to iterate through transitions
		const vertices: StateVertex[] = [];
		for (const transition of this.machines[id].Statements) {
			const sourceId = transition.Source.StateID;
			if (!vertices[sourceId]) {
				// Vec2 for no position data: put vertices in a grid with interval 100, like
				/** 1 2 3 4...
				 *  2 2 3 
				 *  3 3 3 */
				const shell = Math.floor(Math.sqrt(sourceId)) + 1;
				const smallShell = shell - 1;
				const posId = sourceId - (smallShell * smallShell) - Math.floor((shell * shell - smallShell * smallShell) / 2);
				let pos: Vec2;
				if (posId < 0) pos = new Vec2(shell * 100, (-posId + 1) * 100);
				else pos = new Vec2((posId + 1) * 100, shell * 100);
				vertices[sourceId] = new StateVertex(sourceId, pos);
			}
			vertices[sourceId].addTransitions(...transition.Conditions.map(cond => new StateTransition(transition.Target.StateID, cond.Read, cond.Write, cond.Move)));
		}
		for (const vertex of this.machines[id].TransitionNodes) {
			const id = vertex.StateID;
			if (!vertices[id]) {
				const shell = Math.floor(Math.sqrt(id)) + 1;
				const smallShell = shell - 1;
				const posId = id - (smallShell * smallShell) - Math.floor((shell * shell - smallShell * smallShell) / 2);
				let pos: Vec2;
				if (posId < 0) pos = new Vec2(shell * 100, (-posId + 1) * 100);
				else pos = new Vec2((posId + 1) * 100, shell * 100);
				vertices[id] = new StateVertex(id, pos);
			}
		}
		vertices.forEach(vert => graph.addVertex(vert));
		// set starting node for graph
		if (this.machines[id].TransitionNodes.length)
			graph.setStartingNode(this.machines[id].TransitionNodes[0].StateID);
		return this.graphs[id] = graph;
	}

	getMachineConfig(id: number) {
		return this.machines[id];
	}

	getMachineConfigs() {
		return this.machines;
	}

	getTapeConfig(id: number) {
		return this.tapes[id];
	}

	appendInput(val: string) {
		if (this.inputTape < 0 || !this.tapes[this.inputTape]) return;
		const content = (this.tapes[this.inputTape]!.TapeContent || "") + val;
		this.tapes[this.inputTape] = new TapeConfig(this.tapes[this.inputTape]!.TapeType, content.length, content);
		this.dispatchChangeTapeEvent(this.inputTape);
	}

	setInput(val: string) {
		if (this.inputTape < 0 || !this.tapes[this.inputTape]) return;
		this.tapes[this.inputTape] = new TapeConfig(this.tapes[this.inputTape]!.TapeType, val.length, val);
		this.dispatchChangeTapeEvent(this.inputTape);
	}

	clearTapes() {
		this.tapes.forEach((tape, ii) => {
			this.tapes[ii] = tape ? new TapeConfig(tape.TapeType, tape.TapeLength, "") : null;
		});
	}

	getInputTape() {
		return this.inputTape;
	}

	getOutputTape() {
		return this.outputTape;
	}

	setInputTape(id: number) {
		this.inputTape = id;
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.CHANGE_INPUT_TAPE, { detail: id }));
	}

	setOutputTape(id: number) {
		this.outputTape = id;
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.CHANGE_OUTPUT_TAPE, { detail: id }));
	}

	updateMachineHeads(id: number) {
		if (id < 0 || !this.graphs[id] || !this.machines[id]) return;
		this.graphs[id].setHeads(this.machines[id].NumberOfHeads);
	}

	// Category: Simulation

	// Import all configs stored within this class into the real simulator
	build() {
		TuringMachineSimulator.Initialise();
		this.tapes.forEach(tape => tape && TuringMachineSimulator.AddTape(tape));
		this.machines.forEach((machine, ii) => {
			if (!machine) return;
			if (this.graphs[ii]) this.graphs[ii].updateConfig(machine);
			console.log(machine);
			TuringMachineSimulator.AddMachine(machine);
		});
	}

	start() {
		this.build();
		this.running = true;
		TuringMachineSimulator.StartSimulation();
		this.dispatchEvent(new Event(TuringMachineEvent.START));
		this.scheduleNextTick();
	}

	step() {
		TuringMachineSimulator.Update();
		this.state = TuringMachineSimulator.GetSystemState();
		console.log(this.state);
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.STEP, { detail: this.state }));
		let allHalted = true;
		this.state.Machines.forEach((machine, ii) => {
			if (machine.IsHalted) this.dispatchEvent(new CustomEvent(TuringMachineEvent.HALT, { detail: ii }));
			else allHalted = false;
		});
		if (allHalted || !this.running) this.stop();
		else if (!this.paused) this.scheduleNextTick();
	}

	stop() {
		this.running = false;
		TuringMachineSimulator.StopSimulation();
		this.dispatchEvent(new Event(TuringMachineEvent.STOP));
	}

	pause() {
		this.paused = true;
	}

	resume() {
		this.paused = false;
		this.scheduleNextTick();
	}

	reset() {
		this.running = false;
		this.paused = false;
		this.state = undefined;
		this.clearTapes();
		this.dispatchEvent(new Event(TuringMachineEvent.RESET));
	}

	private scheduleNextTick() {
		setTimeout(() => this.step(), this.tickInterval);
	}

	// Category: Wrappers for caching
	
	addMachine(config: TuringMachineConfig, color?: string) {
		if (color === undefined) color = Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0");
		else if (color.startsWith("#")) color = color.slice(1);
		for (let ii = 0; ii < this.machines.length; ii++) {
			if (!this.machines[ii]) {
				this.machines[ii] = { color, ...config };
				return ii;
			}
		}
		this.machines.push({ color, ...config });
		this.dispatchChangeMachineLengthEvent();
		return this.machines.length - 1;
	}

	deleteMachine(id: number) {
		if (this.machines[id]) this.machines[id] = null;
		if (this.graphs[id]) this.graphs[id] = null;
	}

	addTape(config: TapeConfig) {
		for (let ii = 0; ii < this.tapes.length; ii++) {
			if (!this.tapes[ii]) {
				this.tapes[ii] = config;
				return ii;
			}
		}
		this.tapes.push(config);
		if (this.inputTape < 0 && this.tapes.length == 1) this.setInputTape(0);
		if (this.outputTape < 0 && this.tapes.length == 1) this.setOutputTape(0);
		this.dispatchChangeTapeLengthEvent();
	}
	
	deleteTape(id: number) {
		this.tapes[id] = null;
		if (this.inputTape == id) this.setInputTape(-1);
		if (this.outputTape == id) this.setOutputTape(-1);
	}

	getTapes(): Tape[] {
		if (this.state)
			return this.state.Tapes.map(tape => ({ content: tape.Content, type: this.tapes[tape.ID]?.TapeType, id: tape.ID, left: tape.LeftBoundary, right: tape.RightBoundary })).sort((a, b) => a.id - b.id);
		return this.tapes.map((tape, id) => ({ content: tape?.TapeContent, type: tape?.TapeType, id, left: 0, right: tape?.TapeContent.length || 0 })).filter(tape => tape.type !== undefined);
	}

	getMachineTapes(id: number): Tape[] {
		if (id < 0 || !this.machines[id]) return [];
		const tapes = this.getTapes();
		const needed: Tape[] = [];
		for (const ref of this.machines[id].TapesReference) {
			const found = tapes.find(tape => tape.id == ref);
			if (!found) return [];
			needed.push(found);
		}
		return needed;
	}

	setTapeType(id: number, type: TapeTypes) {
		if (id < 0 || !this.tapes[id]) return;
		this.tapes[id] = new TapeConfig(type, this.tapes[id].TapeLength, this.tapes[id].TapeContent);
		this.dispatchChangeTapeEvent(id);
	}

	getMachineHeadPositions(id: number) {
		if (id < 0 || !this.machines[id]) return [];
		if (this.state) {
			const machine = this.state.Machines.find(machine => machine.ID == id);
			if (machine) return machine.Heads.map(head => head.Position);
		}
		return this.machines[id].InitialPositions;
	}

	// Category: Component communication

	dispatchEditEvent(editable?: Editable) {
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.EDIT, { detail: editable }));
	}

	dispatchChangeMachineEvent(id: number) {
		if (!this.machines[id]) throw new Error(`Machine with ID ${id} doesn't exist`);
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.CHANGE_MACHINE, { detail: id }));
	}

	dispatchChangeMachineLengthEvent() {
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.CHANGE_MACHINE_LENGTH, { detail: this.machines.length }));
	}

	dispatchChangeTapeLengthEvent() {
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.CHANGE_TAPE_LENGTH, { detail: this.tapes.filter(tape => tape !== null).length }));
	}

	dispatchChangeTapeEvent(id: number) {
		if (!this.tapes[id]) throw new Error(`Tape with ID ${id} doesn't exist`);
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.CHANGE_TAPE, { detail: id }));
	}

	dispatchPropertiesUpdateEvent() {
		this.dispatchEvent(new Event(TuringMachineEvent.PROPERTIES_UPDATE));
	}

	// Category: Helper functions

	tapeTypeToString(type: TapeTypes) {
		switch (type) {
			case TapeTypes.Infinite: return "Infinite";
			case TapeTypes.LeftLimited: return "Left-Limited";
			case TapeTypes.RightLimited: return "Right-Limited";
			case TapeTypes.LeftRightLimited: return "Left-Right-Limited";
			case TapeTypes.Circular: return "Circular";
		}
	}

	tapeTypeFromString(str: string) {
		switch (str.toLowerCase()) {
			case "infinite": return TapeTypes.Infinite;
			case "left-limited": return TapeTypes.LeftLimited;
			case "right-limited": return TapeTypes.RightLimited;
			case "left-right-limited": return TapeTypes.LeftRightLimited;
			case "circular": return TapeTypes.Circular;
		}
	}

	headTypeToString(type: HeadTypes) {
		switch (type) {
			case HeadTypes.ReadOnly: return "Read-Only";
			case HeadTypes.ReadWrite: return "Read-Write";
			case HeadTypes.WriteOnly: return "Write-Only";
		}
	}

	headTypeFromString(str: string) {
		switch (str.toLowerCase()) {
			case "read-only": return HeadTypes.ReadOnly;
			case "read-write": return HeadTypes.ReadWrite;
			case "write-only": return HeadTypes.WriteOnly;
		}
	}
}

const simulator = new RenderingTuringMachineSimulator();
export default simulator;