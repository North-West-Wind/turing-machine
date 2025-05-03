import { useEffect, useState } from "react";
import DesignerSimulationButton from "./button";
import simulator, { TuringMachineEvent } from "../../../helpers/designer/simulator";
import { TuringMachineConfig } from "../../../logic/TuringMachineConfig";
import { TransitionNode } from "../../../logic/States/Transitions/TransitionNode";
import DesignerSimulationSlider from "./slider";
import EditableBox from "../../common/editable";

export default function DesignerSimulationController(props: { paused: boolean }) {
	const [paused, setPaused] = useState(props.paused);
	const [tickLength, setTickLength] = useState(simulator.tickInterval);

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
		setPaused(true);
	};
 
	const add = () => {
		const start = new TransitionNode(0);
		const id = simulator.addMachine(new TuringMachineConfig(0, [], [], [], [start], [], start));
		simulator.dispatchChangeMachineEvent(id);
	};

	const changeTickLength = (fraction: number) => {
		const length = 5000 - fraction * 5000;
		simulator.tickInterval = length;
		setTickLength(length);
	};

	const changeTickRate = (val: string) => {
		const rate = parseFloat(val);
		if (isNaN(rate) || rate < 0.2) return false;
		const length = 1000 / rate;
		simulator.tickInterval = length;
		setTickLength(length);
	};

	return <div>
		<div className="designer-simulation-controller">
			<DesignerSimulationButton src={`simulation/${paused ? "play" : "pause"}.svg`} onClick={togglePaused} />
			<DesignerSimulationButton src="simulation/reset.svg" onClick={reset} />
		</div>
		<div className="designer-simulation-controller small">
			<DesignerSimulationButton src={`simulation/add.svg`} onClick={add} />
		</div>
		<div className="designer-simulation-controller tick-rate">
			<div>
				<div>
					Tick Rate:
					<EditableBox value={(1000 / tickLength).toFixed(2)} onCommit={changeTickRate} />
				</div>
				<DesignerSimulationSlider fraction={(5000 - tickLength) / 5000} onChange={changeTickLength} />
			</div>
		</div>
	</div>;
}