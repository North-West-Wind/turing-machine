// This needs to be integrated to actual Turing Machine logic in the future

import simulator from "../../../helpers/designer/simulator";
import DesignerSimulationMachineTape from "./machine/tape";

// each element of `tapes` is 7 char long, with index 3 being the middle
export default function DesignerSimulationMachine(props: { name: string, color: string, tapes: number[], onClick: () => void }) {
	return <div className="designer-simulation-machine" style={{ backgroundColor: props.color }} onClick={props.onClick}>
		<div className="title">{props.name}</div>
		{props.tapes.map((tape, ii) => <DesignerSimulationMachineTape values={simulator.getTape(tape)} key={ii} />)}
	</div>;
}