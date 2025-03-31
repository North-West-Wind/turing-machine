import { TapeConfig } from "../../logic/Tapes/TapesUtilities/TapeConfig";
import { TuringMachineConfig } from "../../logic/TuringMachineConfig";
import { TuringMachineSimulator } from "../../logic/TuringMachineSimulator";
import { StateGraph, StateTransition, StateVertex } from "./graph";
import { Vec2 } from "./math";

export type Editable = {
	type: "vertex" | "rect" | "text" | "machine",
	id: number
}

export enum TuringMachineEvent {
	STEP = "tm:step",
	EDIT = "tm:edit",
	CHANGE_MACHINE = "tm:change-machine",
	CHANGE_MACHINE_LENGTH = "tm:change-machine-length",
	CHANGE_TAPE_LENGTH = "tm:change-tape-length",
}

class RenderingTuringMachineSimulator extends EventTarget {
	private machines: ((TuringMachineConfig & { color: string, label?: string }) | null)[] = [];
	private tapes: (TapeConfig | null)[] = [];
	private graphs: (StateGraph | null)[] = [];
	
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
				if (posId < 0) pos = new Vec2(shell * 100, (-posId) * 100);
				else pos = new Vec2(posId * 100, shell * 100);
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
				if (posId < 0) pos = new Vec2(shell * 100, (-posId) * 100);
				else pos = new Vec2(posId * 100, shell * 100);
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

	step() {
		TuringMachineSimulator.Update();
		this.dispatchEvent(new Event(TuringMachineEvent.STEP));
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
		for (let ii = 0; ii < this.machines.length; ii++) {
			if (!this.tapes[ii]) {
				this.tapes[ii] = config;
				return ii;
			}
		}
		this.tapes.push(config);
		this.dispatchChangeMachineLengthEvent();
		return this.tapes.length - 1;
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
}

const simulator = new RenderingTuringMachineSimulator();
export default simulator;