import { useEffect, useState } from "react";
import { StateEdge, StateGraph } from "../../../../helpers/designer/graph";
import DesignerPropertiesEdge from "../edges";
import DesignerPropertiesText from "../text";
import DesignerPropertiesTitle from "../title";
import DesignerPropertiesVec2 from "../vec2";

export default function DesignerPropertiesVertexCombo(props: { graph: StateGraph, id: number }) {
	const [id, setId] = useState(props.id);
	const [graph, setGraph] = useState(props.graph);
	const [vertex, setVertex] = useState(props.graph.getVertex(props.id));

	useEffect(() => {
		setId(props.id);
		setGraph(props.graph);
		setVertex(props.graph.getVertex(props.id));
	}, [props.graph, props.id]);

	if (!vertex) return <></>;
	const outs: [number, StateEdge][] = [], ins: [number, StateEdge][] = [];
	graph.getOutEdges(id)?.forEach((edge, dest) => outs.push([dest, edge]));
	graph.getInEdges(id)?.forEach((edge, src) => ins.push([src, edge]));
	return <>
		<DesignerPropertiesTitle value={`Vertex ${id}`} />
		<DesignerPropertiesText value={vertex.getLabel() || ""} prefix="Label" onCommit={value => vertex.setLabel(value)} />
		<DesignerPropertiesVec2 vec={vertex.getPosition()} prefix="Position" onCommit={vec => vertex.setPosition(vec)} />
		<DesignerPropertiesEdge graph={graph} id={props.id} edges={outs} out />
		<DesignerPropertiesEdge graph={graph} id={props.id} edges={ins} />
	</>;
}