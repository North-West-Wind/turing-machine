import { useState } from "react";
import graph, { Hovered } from "../../../helpers/designer/graph";
import EditableBox from "../../common/editable";

export default function DesignerPropertiesLabel(props: { id: Hovered }) {
	const thing = props.id.type == "vertex" ? graph.getVertex(props.id.id) : undefined;
	if (!thing) return <></>;
	const [value, setValue] = useState(thing.label || "");

	const onCommit = (value: string) => {
		setValue(value);
		thing.label = value;
	};

	return <div className="designer-properties-section">
		<div className="designer-properties-label">
			Label:
			<EditableBox value={value} onCommit={onCommit} />
		</div>
	</div>;
}