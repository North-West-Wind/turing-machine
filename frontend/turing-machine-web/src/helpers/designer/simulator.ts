import { HeadTypes } from "../../logic/Heads/HeadTypes";
import { TransitionNode } from "../../logic/States/Transitions/TransitionNode";
import { HeadTransition, TransitionStatement } from "../../logic/States/Transitions/TransitionStatement";
import { SystemState } from "../../logic/SystemState";
import { TapeConfig } from "../../logic/Tapes/TapesUtilities/TapeConfig";
import { TapeSymbols } from "../../logic/Tapes/TapesUtilities/TapeSymbols";
import { TapeTypes } from "../../logic/Tapes/TapeTypes";
import { TuringMachineConfig } from "../../logic/TuringMachineConfig";
import { TuringMachineSimulator } from "../../logic/TuringMachineSimulator";
import { getLevel, getMachine, PersistenceKey, save } from "../persistence";
import { StateGraph, StateRect, StateText, StateTransition, StateVertex } from "./graph";
import constraints from "./level";
import { Saveable2DVector, SaveableHead, SaveableMachine, SaveableTape, SaveableTransition, SaveableTransitionStatement, SaveableTuringMachine, SaveableUI } from "./machine";
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
	LOAD = "tm:load",
	WARN = "tm:warn",
}

export type Tape = {
	content?: string;
	signals: string;
	type?: TapeTypes;
	id: number;
	left: number;
	right: number;
}

class RenderingTuringMachineSimulator extends EventTarget {
	private machines: ((TuringMachineConfig & { color: string, label?: string }) | null)[] = [];
	private tapes: (TapeConfig | null)[] = [];
	private graphs: (StateGraph | null)[] = [];
	private uiData: (SaveableUI | undefined)[] = [];
	private edgeData: Record<`${number}_${number}`, Saveable2DVector[]>[] = [];
	tickInterval = 1000; // milliseconds
	private paused = false;
	running = false;
	
	private inputTape = -1;
	private outputTape = -1;
	private state?: SystemState;
	private haltAnnounced = new Set<number>();

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
		const vertices: (StateVertex| null)[] = [];
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
				// fill vertices array
				for (let ii = 0; ii <= sourceId - vertices.length; ii++)
					vertices.push(null);
				vertices[sourceId] = new StateVertex(sourceId, pos);
			}
			const read: string[] = [], write: string[] = [], move: number[] = [];
			transition.Conditions.forEach(cond => {
				read.push(cond.Read);
				write.push(this.escapeSymbol(cond.Write));
				move.push(cond.Move);
			});
			vertices[sourceId].addTransitions(new StateTransition(transition.Target.StateID, read, write, move));
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
				// fill vertices array
				for (let ii = 0; ii <= id - vertices.length; ii++)
					vertices.push(null);
				vertices[id] = new StateVertex(id, pos);
			}
		}
		vertices.forEach(vert => {
			if (vert && this.uiData[id]?.nodes[vert.id]) {
				vert.setLabel(this.uiData[id].nodes[vert.id]?.label);
				vert.setPosition(Vec2.fromArray(this.uiData[id].nodes[vert.id]!.position));
			}
			graph.addVertex(vert);
		});
		vertices.forEach(vert => vert && graph.updateVertexEdges(vert.id));
		// update edges with edge data
		if (this.edgeData[id])
			for (const [key, lines] of Object.entries(this.edgeData[id])) {
				if (!lines.length) continue;
				const [src, dest] = key.split("_").map(val => parseInt(val));
				graph.getEdge(src, dest)?.setLines(lines.map(Vec2.fromArray));
			}
		// set starting node for graph
		graph.setStartingNode(this.machines[id].StartNode.StateID);
		// set head number
		graph.setHeads(this.machines[id].NumberOfHeads);
		// load ui data
		if (this.uiData[id]) {
			for (const box of this.uiData[id].boxes) {
				if (box === null) graph.rawAddRect(null);
				else {
					const start = Vec2.fromArray(box.start);
					graph.rawAddRect(new StateRect(start, start.add(box.size[0], box.size[1]), box.color));
				}
			}
			for (const text of this.uiData[id].texts) {
				if (text === null) graph.rawAddText(null);
				else graph.rawAddText(new StateText(text.value, Vec2.fromArray(text.pos)));
			}
		}
		return this.graphs[id] = graph;
	}

	private escapeSymbol(symbol: string) {
		switch (symbol) {
			case TapeSymbols.Pause: return "\\p";
			case TapeSymbols.Running: return "\\r";
			default: return symbol;
		}
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
		this.appendTapeContent(val, this.inputTape);
	}

	appendTapeContent(val: string, tapeId: number) {
		if (tapeId < 0 || !this.tapes[tapeId]) return false;
		const content = (this.tapes[tapeId]!.TapeContent || "") + val;
		this.tapes[tapeId] = new TapeConfig(this.tapes[tapeId]!.TapeType, content.length, content);
		this.dispatchChangeTapeEvent(tapeId);
		return true;
	}

	setInput(val: string) {
		this.setTapeContent(val, this.inputTape);
	}

	setTapeContent(val: string, tapeId: number) {
		if (tapeId < 0 || !this.tapes[tapeId]) return false;
		this.tapes[tapeId] = new TapeConfig(this.tapes[tapeId].TapeType, val.length, val);
		this.dispatchChangeTapeEvent(tapeId);
		return true;
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
	build(overrideInput?: string) {
		TuringMachineSimulator.Initialise();
		let tapes = 0, tapeTypes = true;
		this.tapes.forEach((tape, ii) => {
			if (!tape) return;
			if (ii == this.inputTape && overrideInput !== undefined)
				tape = { TapeContent: overrideInput, TapeLength: overrideInput.length, TapeType: tape.TapeType };
			TuringMachineSimulator.AddTape(tape);
			tapes++;
			if (!constraints.validTapeType(tape.TapeType)) tapeTypes = false;
		});
		let states = 0, transitions = 0, heads = 0;
		this.machines.forEach((machine, ii) => {
			if (!machine) return;
			if (this.graphs[ii]) this.graphs[ii].updateConfig(machine);
			TuringMachineSimulator.AddMachine(machine);
			states += machine.TransitionNodes.length;
			transitions += machine.Statements.length;
			heads += machine.NumberOfHeads;
		});
		// check constraints
		let validation: number[];
		if (constraints.constraints?.states) {
			validation = constraints.validRange(states, constraints.constraints.states);
			if (validation[0] != 0)
				this.dispatchWarningEvent(constraints.rangeConstraintMessage("states", validation[1], validation[2]));
		}
		if (constraints.constraints?.transitions) {
			validation = constraints.validRange(transitions, constraints.constraints.transitions);
			if (validation[0] != 0)
				this.dispatchWarningEvent(constraints.rangeConstraintMessage("transitions", validation[1], validation[2]));
		}
		if (constraints.constraints?.tapes) {
			validation = constraints.validRange(this.tapes.filter(tape => tape !== null).length, constraints.constraints.tapes);
			if (validation[0] != 0)
				this.dispatchWarningEvent(constraints.rangeConstraintMessage("tapes", validation[1], validation[2]));
		}
		if (constraints.constraints?.heads) {
			validation = constraints.validRange(heads, constraints.constraints.heads);
			if (validation[0] != 0)
				this.dispatchWarningEvent(constraints.rangeConstraintMessage("heads", validation[1], validation[2]));
		}
		if (!tapeTypes)
			this.dispatchWarningEvent(`Some tape(s) is/are using disallowed tape type(s). Allowed: ${constraints.constraints?.tapeTypes?.join(", ")}`)
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
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.STEP, { detail: this.state }));
		let allHalted = true;
		this.state.Machines.forEach((machine, ii) => {
			if (machine.IsHalted && !this.haltAnnounced.has(ii)) {
				this.dispatchEvent(new CustomEvent(TuringMachineEvent.HALT, { detail: ii }));
				this.haltAnnounced.add(ii);
			}	else if (!machine.IsHalted) allHalted = false;
		});
		if (allHalted || !this.running) this.stop();
		else if (!this.paused) this.scheduleNextTick();
	}

	stop() {
		this.running = false;
		TuringMachineSimulator.StopSimulation();
		const output = this.state?.Tapes.find(tape => tape.ID == this.outputTape)?.Content.replace(/_/g, "");
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.STOP, { detail: output }));
	}

	pause() {
		this.paused = true;
	}

	resume() {
		this.paused = false;
		this.scheduleNextTick();
	}

	reset() {
		if (this.running) TuringMachineSimulator.StopSimulation();
		this.running = false;
		this.paused = false;
		this.state = undefined;
		this.graphs.forEach(graph => graph?.setCurrentState(-1));
		this.dispatchEvent(new Event(TuringMachineEvent.RESET));
	}

	async test() {
		const level = getLevel();
		if (!level) return false;
		const MAX_STEPS = 1_000_000; // arbitary max step to avoid infinite loop
		for (const { input, output } of level.tests) {
			this.build(input);
			TuringMachineSimulator.StartSimulation();
			let halted = false, steps = 0;
			let state: SystemState | undefined;
			while (!halted && steps <= MAX_STEPS) {
				steps++;
				TuringMachineSimulator.Update();
				state = TuringMachineSimulator.GetSystemState();
				halted = state.Machines.every(machine => machine.IsHalted);
			}
			TuringMachineSimulator.StopSimulation();
			if (!halted) return false;
			const tapeOutput = state?.Tapes.find(tape => tape.ID == this.outputTape)?.Content.replace(/_/g, "");
			if (tapeOutput != output) return false;
		}
		return true;
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
		const plus1 = id + 1;
		if (this.machines.length == plus1) this.machines.pop();
		else if (this.machines[id]) this.machines[id] = null;
		if (this.graphs.length == plus1) this.graphs.pop();
		else if (this.graphs[id]) this.graphs[id] = null;
		if (this.uiData.length == plus1) this.uiData.pop();
		else if (this.uiData[id]) this.uiData[id] = undefined;
		if (this.edgeData.length == plus1) this.uiData.pop();
		else if (this.edgeData[id]) this.edgeData[id] = {};
		this.dispatchChangeMachineLengthEvent();
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
		if (this.machines.some(machine => machine && machine.TapesReference.includes(id))) {
			this.dispatchWarningEvent(`Cannot delete! Tape ${id} is still being used.`);
			return;
		}

		if (id + 1 == this.tapes.length) this.tapes.pop();
		else this.tapes[id] = null;
		if (this.inputTape == id) this.setInputTape(-1);
		if (this.outputTape == id) this.setOutputTape(-1);
		this.dispatchChangeTapeLengthEvent();
	}

	getTapes(): Tape[] {
		if (this.state)
			return this.state.Tapes.map(tape => ({ content: tape.Content, signals: tape.TapeSignal, type: this.tapes[tape.ID]?.TapeType, id: tape.ID, left: tape.LeftBoundary, right: tape.RightBoundary })).sort((a, b) => a.id - b.id);
		return this.tapes.map((tape, id) => ({ content: tape?.TapeContent, signals: "", type: tape?.TapeType, id, left: 0, right: tape?.TapeContent.length || 0 })).filter(tape => tape.type !== undefined);
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
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.CHANGE_MACHINE_LENGTH, { detail: this.machines.filter(machine => !!machine).length }));
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

	dispatchWarningEvent(warning: string) {
		this.dispatchEvent(new CustomEvent(TuringMachineEvent.WARN, { detail: warning }));
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

	headTypeToString(type: HeadTypes, simplified = false) {
		switch (type) {
			case HeadTypes.ReadOnly: return simplified ? "r" : "Read-Only";
			case HeadTypes.ReadWrite: return simplified ? "rw" : "Read-Write";
			case HeadTypes.WriteOnly: return simplified ? "w" : "Write-Only";
		}
	}

	headTypeFromString(str: string) {
		switch (str.toLowerCase()) {
			case "r":
			case "read-only": return HeadTypes.ReadOnly;
			case "rw":
			case "read-write": return HeadTypes.ReadWrite;
			case "w":
			case "write-only": return HeadTypes.WriteOnly;
		}
	}

	// Category: Persistent storage management

	// Save to local storage tm:machine
	save() {
		const machines: (SaveableMachine| null)[] = [];
		this.machines.forEach((machine, ii) => {
			if (machine === null) {
				machines.push(machine);
				return;
			}
			if (this.graphs[ii])
				this.graphs[ii].updateConfig(machine);
			const transitions: SaveableTransition[] = machine.Statements.map(statement => ({
				source: statement.Source.StateID,
				target: statement.Target.StateID,
				statements: statement.Conditions.map(cond => ({ read: cond.Read, write: cond.Write, move: cond.Move })) as SaveableTransitionStatement[],
				lines: this.graphs[ii]?.getEdge(statement.Source.StateID, statement.Target.StateID)?.getLines().map(vec => [vec.x, vec.y]) || this.edgeData[ii][`${statement.Source.StateID}_${statement.Target.StateID}`] || []
			}));
			const heads: SaveableHead[] = [];
			for (let ii = 0; ii < machine.NumberOfHeads; ii++) {
				heads.push({
					type: this.headTypeToString(machine.HeadTypes[ii], true),
					tape: machine.TapesReference[ii],
					position: machine.InitialPositions[ii]
				});
			}
			machines.push({
				transitions,
				heads,
				start: machine.StartNode.StateID,
				ui: Object.assign(this.graphs[ii]?.toSaveable() || this.uiData[ii] || { boxes: [], texts: [], nodes: [] }, { color: parseInt(machine.color, 16) })
			});
		});

		const saveable: SaveableTuringMachine = {
			tapes: this.tapes.map((tape, ii) => tape === null ? tape : {
				type: this.tapeTypeToString(tape.TapeType).toLowerCase(),
				value: tape.TapeContent || undefined,
				input: this.inputTape == ii,
				output: this.outputTape == ii
			} as SaveableTape),
			machines
		};

		const level = getLevel();
		if (level) {
			level.machine = saveable;
			save(PersistenceKey.LEVEL, JSON.stringify(level));
		} else save(PersistenceKey.MACHINE, JSON.stringify(saveable));

		return saveable;
	}

	load() {
		try {
			// load saved machine. priority: level -> machine
			let saveable: SaveableTuringMachine | undefined;
			const level = getLevel();
			if (level) saveable = level.machine;
			else saveable = getMachine();
			if (!saveable) return;
			
			this.tapes = saveable.tapes.map((tape, ii) => {
				if (!tape) return null;
				const type = this.tapeTypeFromString(tape.type);
				if (type === undefined) return null;
				if (tape.input) this.inputTape = ii;
				if (tape.output) this.outputTape = ii;
				return new TapeConfig(type, tape.value?.length || 0, tape.value || "");
			});
			this.graphs = [];
			this.uiData = [];
			this.edgeData = [];
			this.machines = saveable.machines.map((machine, ii) => {
				this.uiData.push(machine?.ui);
				this.edgeData.push({});
				if (!machine) return null;
				const types: HeadTypes[] = [];
				const positions: number[] = [];
				const refs: number[] = [];
				for (const head of machine.heads) {
					const type = this.headTypeFromString(head.type);
					if (type === undefined) return null;
					types.push(type);
					positions.push(head.position);
					refs.push(head.tape);
				}
				let maxNode = 0;
				const usedNodes = new Set<number>();
				const transitions = machine.transitions.map(transition => {
					maxNode = Math.max(maxNode, transition.source, transition.target);
					usedNodes.add(transition.source);
					usedNodes.add(transition.target);
					this.edgeData[ii][`${transition.source}_${transition.target}`] = transition.lines;
					return new TransitionStatement(
						new TransitionNode(transition.source),
						new TransitionNode(transition.target),
						transition.statements.map(statement => new HeadTransition(statement.read, statement.write, statement.move)));
				});
				machine.ui.nodes.forEach((node, ii) => {
					if (node !== null) usedNodes.add(ii);
				});
				return { color: machine.ui.color.toString(16).padStart(6, "0"), ...new TuringMachineConfig(
					machine.heads.length,
					types,
					positions,
					refs,
					Array.from(usedNodes).map(node => new TransitionNode(node)),
					transitions,
					new TransitionNode(machine.start)
				)};
			});
			this.dispatchEvent(new Event(TuringMachineEvent.LOAD));
			console.log(`Loaded ${this.machines.length} machines and ${this.tapes.length} tapes`);
		} catch (err) {
			console.error(err);
		}
	}
}

const simulator = new RenderingTuringMachineSimulator();
export default simulator;