import { ChangeEvent, useEffect, useState } from "react";
import { HeadTypes } from "../../../logic/Heads/HeadTypes";
import simulator from "../../../helpers/designer/simulator";

export default function DesignerPropertiesHeads(props: { heads: { tape: number, type: HeadTypes }[], onAdd: () => void, onDelete: (index: number) => void, onChangeRef: (index: number, ref: number) => void, onChangeType: (index: number, type: HeadTypes) => void }) {
	const [collapsed, setCollapsed] = useState(false);
	const [heads, setHeads] = useState(props.heads);

	useEffect(() => {
		setHeads(props.heads);
	}, [props.heads]);

	const onHeadRefChange = (index: number, v: string) => {
		const ref = parseInt(v);
		if (isNaN(ref)) return false;
		props.onChangeRef(index, ref);
	};

	const onHeadTypeChange = (index: number, ev: ChangeEvent<HTMLSelectElement>) => {
		const type = simulator.headTypeFromString(ev.target.value);
		if (type === undefined) return;
		props.onChangeType(index, type);
	}
	
	return <div className="designer-properties-section">
		{collapsed && <div className="designer-properties-heads header">
			<div className="title" onClick={() => setCollapsed(false)}>▶ Heads: {props.heads.map(head => `${simulator.headTypeToString(head.type)} ${head.tape}`)}</div>
			<div className="add-button" onClick={props.onAdd}>Add</div>
		</div>}
		{!collapsed && <>
			<div className="designer-properties-heads header">
				<div className="title" onClick={() => setCollapsed(true)}>▼ Heads</div>
				<div className="add-button" onClick={props.onAdd}>Add</div>
			</div>
			{heads.map((head, ii) => <div className="designer-properties-heads" key={ii}>
				<select defaultValue={simulator.headTypeToString(head.type)} onChange={(ev) => onHeadTypeChange(ii, ev)}>
					<option value={simulator.headTypeToString(HeadTypes.ReadOnly)}>read-only</option>
					<option value={simulator.headTypeToString(HeadTypes.ReadWrite)}>read-write</option>
					<option value={simulator.headTypeToString(HeadTypes.WriteOnly)}>write-only</option>
				</select>
				<select className="tape-ref" defaultValue={head.tape} onChange={(ev) => onHeadRefChange(ii, ev.currentTarget.value)}>
					{simulator.getTapes().map(tape => {
						return <option value={tape.id}>{tape.id} {simulator.getInputTape() == tape.id ? " (in)" : ""} {simulator.getOutputTape() == tape.id ? " (out)" : ""}</option>
					})}
				</select>
				<div className="designer-properties-delete" onClick={() => props.onDelete(ii)}>Delete</div>
			</div>)}
		</>}
	</div>;
}