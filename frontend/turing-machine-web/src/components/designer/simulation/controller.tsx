import { useState } from "react";
import DesignerSimulationButton from "./button";
import simulator from "../../../helpers/designer/simulator";
import { TuringMachineConfig } from "../../../logic/TuringMachineConfig";
import { TransitionNode } from "../../../logic/States/Transitions/TransitionNode";

export default function DesignerSimulationController(props: { paused: boolean }) {
	const [paused, setPaused] = useState(props.paused);

	const add = () => {
		const start = new TransitionNode(0);
		const id = simulator.addMachine(new TuringMachineConfig(0, [], [], [], [start], [], start));
		simulator.dispatchChangeMachineEvent(id);
	};

	return <div>
		<div className="designer-simulation-controller">
			<DesignerSimulationButton src={`simulation/${paused ? "play" : "pause"}.svg`} onClick={() => setPaused(!paused)} />
			<DesignerSimulationButton src="simulation/reset.svg" onClick={() => setPaused(true)} />
		</div>
		<div className="designer-simulation-controller small">
			<DesignerSimulationButton src={`simulation/add.svg`} onClick={add} />
		</div>
	</div>;
}