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
}

class RenderingTuringMachineSimulator extends EventTarget {
	private machines: ((TuringMachineConfig & { color: string, label?: string }) | null)[] = [];
	private tapes: (TapeConfig | null)[] = [];
	private graphs: (StateGraph | null)[] = [];
	private tickInterval = 1000; // milliseconds
	private paused = false;
	running = false;

	constructor() {
		super();
		// Always 2 tapes: Input and Output
		this.addTape(new TapeConfig(TapeTypes.Infinite, 0, ""));
		this.addTape(new TapeConfig(TapeTypes.Infinite, 0, ""));
	}
	
	// Categpry: Pre-simulation

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
		const content = (this.tapes[0]?.TapeContent || "") + val;
		this.tapes[0] = new TapeConfig(TapeTypes.Infinite, content.length, content);
		this.dispatchChangeTapeEvent(0);
	}

	setInput(val: string) {
		this.tapes[0] = new TapeConfig(TapeTypes.Infinite, val.length, val);
		this.dispatchChangeTapeEvent(0);
	}

	// Category: Simulation

	// Import all configs stored within this class into the real simulator
	build() {
		TuringMachineSimulator.Initialise();
		this.tapes.forEach(tape => tape && TuringMachineSimulator.AddTape(tape));
		this.machines.forEach((machine, ii) => {
			if (!machine) return;
			if (this.graphs[ii]) this.graphs[ii].updateConfig(machine);
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
		const state = TuringMachineSimulator.GetSystemState();
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.STEP, { detail: state }));
		let allHalted = true;
		state.Machines.forEach((machine, ii) => {
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
		this.dispatchChangeMachineLengthEvent();
		return this.tapes.length - 1;
	}
	
	deleteTape(id: number) {
		if (0 >= id || id <= 1) throw new Error("Cannot delete input or output tape");
		this.tapes[id] = null;
	}

	checkForUnusedTapes() {
		const used = new Set<number>();
		for (const machine of this.machines) {
			if (!machine) continue;
			machine.TapesReference.forEach(ref => used.add(ref));
		}
		for (let ii = 2; ii < this.tapes.length; ii++) {
			if (!used.has(ii)) this.deleteTape(ii);
		}
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

	dispatchChangeTapeLengthEeent() {
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.CHANGE_TAPE_LENGTH, { detail: this.tapes.length }));
	}

	dispatchChangeTapeEvent(id: number) {
		if (!this.tapes[id]) throw new Error(`Tape with ID ${id} doesn't exist`);
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.CHANGE_TAPE, { detail: id }));
	}
}

const simulator = new RenderingTuringMachineSimulator();
export default simulator;