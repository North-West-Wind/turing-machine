import { useEffect, useState } from "react";
import { StateGraph } from "../../../../helpers/designer/graph";
import DesignerPropertiesText from "../text";
import DesignerPropertiesTitle from "../title";
import DesignerPropertiesVec2 from "../vec2";
import DesignerPropertiesDelete from "../delete";

export default function DesignerPropertiesTextCombo(props: { graph: StateGraph, id: number }) {
	const [id, setId] = useState(props.id);
	const [text, setText] = useState(props.graph.getText(props.id));

	useEffect(() => {
		setId(props.id);
		setText(props.graph.getText(props.id));
	}, [props.graph, props.id]);

	const deleteText = () => {
		if (!confirm("Are you sure you want to delete this label?")) return;
		props.graph.deleteText(id);
	};

	if (!text) return <></>;
	return <>
		<DesignerPropertiesTitle value={`Text ${id}`} />
		<DesignerPropertiesDelete onClick={deleteText} />
		<DesignerPropertiesText value={text.getValue()} prefix="Value" onCommit={value => text.setValue(value)} />
		<DesignerPropertiesVec2 vec={text.getPosition()} prefix="Position" onCommit={vec => text.setPosition(vec)} />
	</>;
}