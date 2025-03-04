// This needs to be integrated to actual Turing Machine logic in the future

import DesignerSimulationMachineTape from "./machine/tape";

// each element of `tapes` is 7 char long, with index 3 being the middle
export default function DesignerSimulationMachine(props: { name: string, color: string, tapes: string[] }) {
	return <div className="designer-simulation-machine" style={{ backgroundColor: props.color }}>
		<div className="title">{props.name}</div>
		{props.tapes.map((tape, ii) => <DesignerSimulationMachineTape values={tape} key={ii} />)}
	</div>;
}