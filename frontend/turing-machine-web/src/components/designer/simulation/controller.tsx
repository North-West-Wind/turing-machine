import { useEffect, useState } from "react";
import DesignerSimulationButton from "./button";
import simulator, { TuringMachineEvent } from "../../../helpers/designer/simulator";
import { TuringMachineConfig } from "../../../logic/TuringMachineConfig";
import { TransitionNode } from "../../../logic/States/Transitions/TransitionNode";

export default function DesignerSimulationController(props: { paused: boolean }) {
	const [paused, setPaused] = useState(props.paused);

	useEffect(() => {
		const onTmStop = () => {
			setPaused(true);
		};

		simulator.addEventListener(TuringMachineEvent.STOP, onTmStop);
		return () => {
			simulator.removeEventListener(TuringMachineEvent.STOP, onTmStop);
		};
	}, []);

	const togglePaused = () => {
		if (paused) {
			if (!simulator.running) simulator.start();
			else simulator.resume();
			setPaused(false);
		} else if (simulator.running) {
			simulator.pause();
			setPaused(true);
		}
	};

	const reset = () => {
		simulator.reset();
		simulator.setInput("");
		setPaused(true);
	};
 
	const add = () => {
		const start = new TransitionNode(0);
		const id = simulator.addMachine(new TuringMachineConfig(0, [], [], [], [start], [], start));
		simulator.dispatchChangeMachineEvent(id);
	};

	return <div>
		<div className="designer-simulation-controller">
			<DesignerSimulationButton src={`simulation/${paused ? "play" : "pause"}.svg`} onClick={togglePaused} />
			<DesignerSimulationButton src="simulation/reset.svg" onClick={reset} />
		</div>
		<div className="designer-simulation-controller small">
			<DesignerSimulationButton src={`simulation/add.svg`} onClick={add} />
		</div>
	</div>;
}