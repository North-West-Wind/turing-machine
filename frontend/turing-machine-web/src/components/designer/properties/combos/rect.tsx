import { useEffect, useState } from "react";
import { StateGraph } from "../../../../helpers/designer/graph";
import DesignerPropertiesText from "../text";
import DesignerPropertiesTitle from "../title";
import DesignerPropertiesVec2 from "../vec2";

export default function DesignerPropertiesRectCombo(props: { graph: StateGraph, id: number }) {
	const [id, setId] = useState(props.id);
	const [rect, setRect] = useState(props.graph.getRect(props.id));
	
	useEffect(() => {
		setId(props.id);
		setRect(props.graph.getRect(props.id));
	}, [props.graph, props.id]);

	if (!rect) return <></>;
	return <>
		<DesignerPropertiesTitle value={`Box ${id}`} />
		<DesignerPropertiesText value={rect.getColor()} prefix="Color" onCommit={value => rect.setColor(value)} />
		<DesignerPropertiesVec2 vec={rect.getStart()} prefix="Start" onCommit={vec => rect.setStart(vec)} />
		<DesignerPropertiesVec2 vec={rect.getEnd()} prefix="End" onCommit={vec => rect.setEnd(vec)} />
	</>;
}