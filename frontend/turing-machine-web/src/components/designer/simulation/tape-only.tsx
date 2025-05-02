import { ChangeEvent, useEffect, useState } from "react";
import { SystemState } from "../../../logic/SystemState";
import simulator, { Tape, TuringMachineEvent } from "../../../helpers/designer/simulator";
import constraints from "../../../helpers/designer/level";
import { TapeSymbols } from "../../../logic/Tapes/TapesUtilities/TapeSymbols";
import { tapeToSevenCells } from "../../../helpers/designer/tape";

export default function DesginerSimulationTape(props: { tape: Tape, index: number }) {
	const [pos, setPos] = useState(0);
	const [tape, setTape] = useState(props.tape);
	const [input, setInput] = useState(simulator.getInputTape());
	const [output, setOutput] = useState(simulator.getOutputTape());

	useEffect(() => {
		const onTmStep = (ev: CustomEventInit<SystemState>) => {
			if (!ev.detail) return;
			const newTape = ev.detail.Tapes.find(tape => tape.ID == props.index);
			if (newTape)
				setTape({ content: newTape.Content, signals: newTape.TapeSignal, type: tape.type, left: newTape.LeftBoundary, right: newTape.RightBoundary, id: tape.id });
		};

		const onTmReset = () => {
			setTape(props.tape);
		};

		const onTmTapeChange = (ev: CustomEventInit<number>) => {
			if (ev.detail != props.index) return;
			const tapeConfig = simulator.getTapeConfig(props.index);
			setTape({ content: tapeConfig?.TapeContent, signals: "", type: tapeConfig?.TapeType, left: 0, right: tapeConfig?.TapeContent?.length || 0, id: tape.id });
		};

		const onTmInputTapeChange = (ev: CustomEventInit<number>) => {
			if (ev.detail === undefined) return;
			setInput(ev.detail);
		};

		const onTmOutputTapeChange = (ev: CustomEventInit<number>) => {
			if (ev.detail === undefined) return;
			setOutput(ev.detail);
		};
		
		simulator.addEventListener(TuringMachineEvent.STEP, onTmStep);
		simulator.addEventListener(TuringMachineEvent.RESET, onTmReset);
		simulator.addEventListener(TuringMachineEvent.CHANGE_TAPE, onTmTapeChange);
		simulator.addEventListener(TuringMachineEvent.CHANGE_INPUT_TAPE, onTmInputTapeChange);
		simulator.addEventListener(TuringMachineEvent.CHANGE_OUTPUT_TAPE, onTmOutputTapeChange);
		return () => {
			simulator.removeEventListener(TuringMachineEvent.STEP, onTmStep);
			simulator.removeEventListener(TuringMachineEvent.RESET, onTmReset);
			simulator.removeEventListener(TuringMachineEvent.CHANGE_TAPE, onTmTapeChange);
			simulator.removeEventListener(TuringMachineEvent.CHANGE_INPUT_TAPE, onTmInputTapeChange);
			simulator.removeEventListener(TuringMachineEvent.CHANGE_OUTPUT_TAPE, onTmOutputTapeChange);
		};
	}, []);

	// process tape to make it 7-cell
	const cells = tapeToSevenCells(tape, pos);

	const asInput = () => simulator.setInputTape(props.index);
	const asOutput = () => simulator.setOutputTape(props.index);

	const moveLeft = () => setPos(pos - 1);
	const moveRight = () => setPos(pos + 1);

	const changeType = (ev: ChangeEvent<HTMLSelectElement>) => {
		const type = simulator.tapeTypeFromString(ev.currentTarget.value);
		if (type !== undefined) simulator.setTapeType(props.index, type);
	};

	return <div className="designer-simulation-tape-only">
		<div className="designer-simulation-tape-header">
			<div className="name">Tape {props.index} {props.index == input ? " (in)" : ""} {props.index == output ? " (out)" : ""}</div>
			<div className="tape-setter">
				{props.index != input && <div className="in" onClick={asInput}>As Input</div>}
				{props.index != output && <div className="out" onClick={asOutput}>As Output</div>}
			</div>
		</div>
		<div className="designer-simulation-tape-move">
			<div className="move-button" onClick={moveLeft}>{"<"}</div>
			<div className="middle">Position: {pos}</div>
			<div className="move-button" onClick={moveRight}>{">"}</div>
		</div>
		<div className="designer-simulation-tape-type">
			<div>Type:</div>
			<select defaultValue={tape.type !== undefined ? simulator.tapeTypeToString(tape.type).toLowerCase() : undefined} onChange={changeType}>
				{constraints.availableTapeTypes().map((type, ii) => {
					const name = simulator.tapeTypeToString(type);
					return <option value={name.toLowerCase()} key={ii}>{name}</option>;
				})}
			</select>
		</div>
		<div className="designer-simulation-tape">
			{cells.map((cell, ii) => <div className={"designer-simulation-cell" + (ii == 3 ? " head" : "") + cell.type} key={ii}>{cell.char == TapeSymbols.Blank ? "" : cell.char}</div>)}
		</div>
	</div>;
}