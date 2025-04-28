import { useEffect, useState } from "react";
import simulator, { TuringMachineEvent } from "../../../helpers/designer/simulator";
import DesginerSimulationTape from "./tape-only";
import DesignerSimulationButton from "./button";
import { TapeConfig } from "../../../logic/Tapes/TapesUtilities/TapeConfig";
import constraints from "../../../helpers/designer/level";

export default function DesignerSimulationTapes() {
	const [tapes, setTapes] = useState(simulator.getTapes());

	useEffect(() => {
		const onTmTapeLengthChange = () => {
			console.log(simulator.getTapes());
			setTapes(Array.from(simulator.getTapes()));
		};

		simulator.addEventListener(TuringMachineEvent.CHANGE_TAPE_LENGTH, onTmTapeLengthChange);
		return () => simulator.removeEventListener(TuringMachineEvent.CHANGE_TAPE_LENGTH, onTmTapeLengthChange);
	}, []);

	const add = () => {
		simulator.addTape(new TapeConfig(constraints.defaultTapeType(), 0, ""));
	};

	return <>
		<div className="designer-simulation-controller small">
			<DesignerSimulationButton src={`simulation/add.svg`} text="Add Tape" onClick={add} />
		</div>
		{tapes.map(tape => <DesginerSimulationTape tape={tape} index={tape.id} key={tape.id} />)}
	</>;
}