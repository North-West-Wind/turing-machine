// This needs to be integrated to actual Turing Machine logic in the future

import { useEffect, useState } from "react";
import simulator, { Tape, TuringMachineEvent } from "../../../helpers/designer/simulator";
import DesignerSimulationMachineTape from "./machine/tape";
import { SystemState } from "../../../logic/SystemState";
import { SignalState } from "../../../logic/States/SignalStates";

// each element of `tapes` is 7 char long, with index 3 being the middle
export default function DesignerSimulationMachine(props: { name: string, color: string, tapes: number[], id: number, onClick: () => void, selected: boolean }) {
	const machine = simulator.getMachineConfig(props.id);
	if (!machine) return <></>;

	const [tapes, setTapes] = useState(simulator.getMachineTapes(props.id));
	const [heads, setHeads] = useState(simulator.getMachineHeadPositions(props.id));
	const [signal, setSignal] = useState(SignalState.Other);
	useEffect(() => {
		const onTmTapeChange = (ev: CustomEventInit<number>) => {
			if (ev.detail === undefined || !tapes.find(tape => tape.id == ev.detail)) return;
			setTapes(simulator.getMachineTapes(props.id));
		};

		const onTmStep = (ev: CustomEventInit<SystemState>) => {
			if (!ev.detail) return;
			const newTapes: Tape[] = [];
			const heads: number[] = [];
			ev.detail.Machines[props.id].Heads.forEach((head, ii) => {
				const tape = ev.detail!.Tapes[head.TapeID];
				newTapes.push({ content: tape.Content, signals: tape.TapeSignal, type: tapes[ii].type, left: tape.LeftBoundary, right: tape.RightBoundary, id: tapes[ii].id });
				heads.push(head.Position);
			});
			setTapes(newTapes);
			setHeads(heads);
			setSignal(ev.detail.Machines[props.id].Signal);
		};

		const onTmReset = () => {
			setTapes(simulator.getMachineTapes(props.id));
			setHeads(machine.InitialPositions);
			setSignal(SignalState.Other);
		};

		simulator.addEventListener(TuringMachineEvent.CHANGE_TAPE, onTmTapeChange);
		simulator.addEventListener(TuringMachineEvent.STEP, onTmStep);
		simulator.addEventListener(TuringMachineEvent.RESET, onTmReset);
		return () => {
			simulator.removeEventListener(TuringMachineEvent.CHANGE_TAPE, onTmTapeChange);
			simulator.removeEventListener(TuringMachineEvent.STEP, onTmStep);
			simulator.removeEventListener(TuringMachineEvent.RESET, onTmReset);
		};
	}, []);

	const onDelete = () => {
		if (!confirm("Are you sure you want to delete this machine?")) return;
		simulator.deleteMachine(props.id);
	}

	let signalString: string;
	switch (signal) {
		case SignalState.Other: signalString = ""; break;
		case SignalState.Blue: signalString = " (Ready)"; break;
		case SignalState.Green: signalString = " (Running)"; break;
		case SignalState.Orange: signalString = " (Paused)"; break;
		case SignalState.Red: signalString = " (Halted)"; break;
	}

	return <div className="designer-simulation-machine" style={{ backgroundColor: props.color }}>
		<div className="title-container">
			<div className="title">{props.name}{signalString}</div>
			<div className="buttons">
				<div className="select-button" onClick={props.onClick}>Select</div>
				<div className="edit-button" onClick={() => simulator.dispatchEditEvent({ type: "machine", id: props.id })}>Edit</div>
				<div className="delete-button" onClick={onDelete}>Delete</div>
			</div>
		</div>
		{tapes.map((tape, ii) => <DesignerSimulationMachineTape tape={tape} head={heads[ii]} key={ii} />)}
	</div>;
}