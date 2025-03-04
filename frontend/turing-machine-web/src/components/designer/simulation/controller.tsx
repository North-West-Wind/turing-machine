import { useState } from "react";
import DesignerSimulationButton from "./button";

export default function DesignerSimulationController(props: { paused: boolean }) {
	const [paused, setPaused] = useState(props.paused);

	return <div className="designer-simulation-controller">
		<DesignerSimulationButton src={`simulation/${paused ? "play" : "pause"}.svg`} onClick={() => setPaused(!paused)} />
		<DesignerSimulationButton src="simulation/reset.svg" onClick={() => setPaused(true)} />
	</div>
}