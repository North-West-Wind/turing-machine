import { useState } from "react";
import graph, { Hovered, StateRect, StateVertex } from "../../../helpers/designer/graph";
import EditableBox from "../../common/editable";

type Thing = StateVertex | StateRect;

export default function DesignerPropertiesText(props: { prefix: string, id: Hovered, getValue: (thing: Thing) => string, onCommit: (thing: Thing, value: string) => boolean }) {
	const thing = props.id.type == "vertex" ? graph.getVertex(props.id.id) : graph.getRect(props.id.id);
	if (!thing) return <></>;
	const [value, setValue] = useState(props.getValue(thing));
	const [reset, setReset] = useState(false); // used for resetting box

	const onCommit = (value: string) => {
		if (props.onCommit(thing, value))
			setValue(value);
		else
			setReset(!reset);
	};

	return <div className="designer-properties-section">
		<div className="designer-properties-label">
			{props.prefix}:
			<EditableBox value={value} onCommit={onCommit} key={reset ? 1 : 0} />
		</div>
	</div>;
}