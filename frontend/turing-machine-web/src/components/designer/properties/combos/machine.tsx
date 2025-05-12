import { useEffect, useState } from "react";
import simulator from "../../../../helpers/designer/simulator";
import DesignerPropertiesTitle from "../title";
import DesignerPropertiesText from "../text";
import DesignerPropertiesHeads from "../heads";
import { HeadTypes } from "../../../../logic/Heads/HeadTypes";
import { TapeConfig } from "../../../../logic/Tapes/TapesUtilities/TapeConfig";
import constraints from "../../../../helpers/designer/level";

export default function DesignerPropertiesMachineCombo(props: { id: number }) {
	const [id, setId] = useState(props.id);
	const [machine, setMachine] = useState(simulator.getMachineConfig(props.id));
	const [heads, setHeads] = useState(machine?.TapesReference.map((tape, ii) => ({ tape, type: machine.HeadTypes[ii] })));
	const [color, setColorState] = useState(simulator.getMachineColor(props.id));

	useEffect(() => {
		setId(props.id);
		setMachine(simulator.getMachineConfig(props.id));
	}, [props.id]);

	if (!machine || !heads) return <></>;

	const setColor = (color: string) => {
		if (!/^[0-9a-fA-F]{6}$/.test(color)) return false;
		const parsed = parseInt(color, 16);
		simulator.setMachineColor(props.id, parsed);
		setColorState(parsed);
		return true;
	};

	const addHead = () => {
		machine.TapesReference.push(0);
		if (!simulator.getTapeConfig(0)) simulator.addTape(new TapeConfig(constraints.defaultTapeType(), 0, ""));
		machine.HeadTypes.push(HeadTypes.ReadWrite);
		machine.InitialPositions.push(0);
		machine.NumberOfHeads++;
		simulator.updateMachineHeads(id);
		setHeads(machine.TapesReference.map((tape, ii) => ({ tape, type: machine.HeadTypes[ii] })));
	};

	const deleteHead = (index: number) => {
		if (!confirm("Are you sure you want to remove this head?")) return;
		machine.TapesReference.splice(index, 1);
		machine.HeadTypes.splice(index, 1);
		machine.InitialPositions.splice(index, 1);
		machine.NumberOfHeads--;
		simulator.updateMachineHeads(id);
		setHeads(machine.TapesReference.map((tape, ii) => ({ tape, type: machine.HeadTypes[ii] })));
	};

	const changeHeadRef = (index: number, ref: number) => {
		machine.TapesReference[index] = ref;
		while (!simulator.getTapeConfig(ref))
			simulator.addTape(new TapeConfig(constraints.defaultTapeType(), 0, ""));
	};

	const changeHeadType = (index: number, type: HeadTypes) => {
		machine.HeadTypes[index] = type;
	}

	return <>
		<DesignerPropertiesTitle value={`Machine ${id}`} />
		<DesignerPropertiesText value={color.toString(16).padStart(6, "0")} prefix="Color" onCommit={setColor} />
		<DesignerPropertiesHeads heads={heads} onAdd={addHead} onDelete={deleteHead} onChangeRef={changeHeadRef} onChangeType={changeHeadType} />
	</>;
}