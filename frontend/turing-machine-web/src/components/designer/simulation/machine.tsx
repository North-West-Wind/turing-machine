// This needs to be integrated to actual Turing Machine logic in the future

import { useEffect, useState } from "react";
import simulator, { TuringMachineEvent } from "../../../helpers/designer/simulator";
import DesignerSimulationMachineTape from "./machine/tape";
import { SystemState } from "../../../logic/SystemState";

// each element of `tapes` is 7 char long, with index 3 being the middle
export default function DesignerSimulationMachine(props: { name: string, color: string, tapes: number[], id: number, onClick: () => void, selected: boolean }) {
	const machine = simulator.getMachineConfig(props.id);
	if (!machine) return <></>;

	const [tapes, setTapes] = useState(machine.TapesReference.map(ref => simulator.getTapeConfig(ref)?.TapeContent));
	const [heads, setHeads] = useState(machine.InitialPositions);
	useEffect(() => {
		const onTmTapeChange = (ev: CustomEventInit<number>) => {
			if (ev.detail === undefined) return;
			tapes[ev.detail] = simulator.getTapeConfig(ev.detail)?.TapeContent;
			setTapes(Array.from(tapes));
		};

		const onTmStep = (ev: CustomEventInit<SystemState>) => {
			if (!ev.detail) return;
			const tapes: string[] = [];
			const heads: number[] = [];
			console.log(ev.detail.Machines);
			ev.detail.Machines[props.id].Heads.forEach(head => {
				tapes.push(ev.detail!.Tapes[head.TapeID].Content);
				heads.push(head.Position);
			});
			setTapes(tapes);
			setHeads(heads);
		};

		const onTmReset = () => {
			setTapes(machine.TapesReference.map(ref => simulator.getTapeConfig(ref)?.TapeContent));
			setHeads(machine.InitialPositions);
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

	return <div className="designer-simulation-machine" style={{ backgroundColor: props.color }} onClick={props.onClick}>
		<div className="title-container">
			<div className="title">{props.name}</div>
			<div className="edit-button" onClick={() => simulator.dispatchEditEvent({ type: "machine", id: props.id })}>Edit</div>
		</div>
		{tapes.map((tape, ii) => <DesignerSimulationMachineTape values={tape} head={heads[ii]} key={ii} />)}
	</div>;
}