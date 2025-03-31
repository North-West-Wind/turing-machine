import { SystemState } from "../../logic/SystemState";
import { TapeConfig } from "../../logic/Tapes/TapesUtilities/TapeConfig";
import { TapeTypes } from "../../logic/Tapes/TapeTypes";
import { TuringMachineConfig } from "../../logic/TuringMachineConfig";
import { TuringMachineSimulator } from "../../logic/TuringMachineSimulator";
import { Hovered, StateGraph, StateTransition, StateVertex } from "./graph";
import { Vec2 } from "./math";

export enum TuringMachineEvent {
	STEP = "tm:step",
	EDIT = "tm:edit",
	CHANGE_MACHINE = "tm:change-machine",
	CHANGE_MACHINE_LENGTH = "tm:change-machine-length"
}

class RenderingTuringMachineSimulator extends EventTarget {
	private machineConfigs: ((TuringMachineConfig & { color: string }) | null)[] = [];
	private systemState: SystemState;

	constructor() {
		super();
		TuringMachineSimulator.Initialise();
		this.systemState = TuringMachineSimulator.GetSystemState();
	}

	// Category: Data Retrieval

	getMachineGraph(id: number) {
		if (!this.machineConfigs[id]) throw new Error(`Machine with ID ${id} doesn't exist`);
		const graph = new StateGraph();
		// Transition is always more than vertices
		// More efficient to iterate through transitions
		const vertices: StateVertex[] = [];
		for (const transition of this.machineConfigs[id].Statements) {
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
		for (const vertex of this.machineConfigs[id].TransitionNodes) {
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
		return graph;
	}

	getMachineAndTape(id: number) {
		if (!this.machineConfigs[id]) throw new Error(`Machine with ID ${id} doesn't exist`);
	}

	getMachine(id: number) {
		return this.systemState.Machines[id];
	}

	getMachines() {
		return this.machineConfigs;
	}

	getTape(id: number) {
		return this.systemState.Tapes[id].Content;
	}

	// Category: Simulation

	step() {
		TuringMachineSimulator.Update();
		this.systemState = TuringMachineSimulator.GetSystemState();
		this.dispatchEvent(new Event(TuringMachineEvent.STEP));
	}

	// Category: Wrappers for caching
	
	addMachine(config: TuringMachineConfig, color?: string) {
		if (color === undefined) color = Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0");
		else if (color.startsWith("#")) color = color.slice(1);
		const maxTapeRef = config.TapesReference.length ? config.TapesReference.reduce((a, b) => Math.max(a, b)) : 0;
		for (let ii = 0; ii < maxTapeRef + 1 - this.systemState.Tapes.length; ii++) {
			TuringMachineSimulator.AddTape(new TapeConfig(TapeTypes.Infinite, 0, ""));
		}
		const id = TuringMachineSimulator.AddMachine(config);
		this.machineConfigs[id] = { color, ...config };
		this.dispatchChangeMachineLengthEvent();
		this.systemState = TuringMachineSimulator.GetSystemState();
		return id;
	}

	deleteMachine(id: number) {
		try {
			TuringMachineSimulator.DeleteMachine(id);
			this.machineConfigs[id] = null;
			this.dispatchChangeMachineLengthEvent();
			this.systemState = TuringMachineSimulator.GetSystemState();
		} catch (err) { }
	}

	addTape(config: TapeConfig) {
		const id = TuringMachineSimulator.AddTape(config);
		return id;
	}

	// Category: Component communication

	dispatchEditEvent(hovered?: Hovered) {
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.EDIT, { detail: hovered }));
	}

	dispatchChangeMachineEvent(id: number) {
		if (!this.machineConfigs[id]) throw new Error(`Machine with ID ${id} doesn't exist`);
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.CHANGE_MACHINE, { detail: id }));
	}

	dispatchChangeMachineLengthEvent() {
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.CHANGE_MACHINE_LENGTH, { detail: this.machineConfigs.length }));
	}
}

const simulator = new RenderingTuringMachineSimulator();
export default simulator;