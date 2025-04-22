import { ChangeEvent, useEffect, useState } from "react";
import { HeadTypes } from "../../../logic/Heads/HeadTypes";
import EditableBox from "../../common/editable";

function headTypeToName(type: HeadTypes) {
	switch (type) {
		case HeadTypes.ReadOnly: return "read-only";
		case HeadTypes.ReadWrite: return "read-write";
		case HeadTypes.WriteOnly: return "write-only";
	}
}

function nameToHeadType(name: string) {
	switch (name) {
		case "read-only": return HeadTypes.ReadOnly;
		case "read-write": return HeadTypes.ReadWrite;
		case "write-only": return HeadTypes.WriteOnly;
	}
}

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
		const type = nameToHeadType(ev.target.value);
		if (type === undefined) return;
		props.onChangeType(index, type);
	}
	
	return <div className="designer-properties-section">
		{collapsed && <div className="designer-properties-heads header">
			<div className="title" onClick={() => setCollapsed(false)}>▶ Heads: {props.heads.map(head => `${headTypeToName(head.type)} ${head.tape}`)}</div>
			<div className="add-button" onClick={props.onAdd}>Add</div>
		</div>}
		{!collapsed && <>
			<div className="designer-properties-heads header">
				<div className="title" onClick={() => setCollapsed(true)}>▼ Heads</div>
				<div className="add-button" onClick={props.onAdd}>Add</div>
			</div>
			{heads.map((head, ii) => <div className="designer-properties-heads" key={ii}>
				<select defaultValue={headTypeToName(head.type)} onChange={(ev) => onHeadTypeChange(ii, ev)}>
					<option value={headTypeToName(HeadTypes.ReadOnly)}>read-only</option>
					<option value={headTypeToName(HeadTypes.ReadWrite)}>read-write</option>
					<option value={headTypeToName(HeadTypes.WriteOnly)}>write-only</option>
				</select>
				<EditableBox value={head.tape.toString()} onCommit={(v) => onHeadRefChange(ii, v)} />
			</div>)}
		</>}
	</div>;
}