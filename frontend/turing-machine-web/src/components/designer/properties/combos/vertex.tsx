import { useEffect, useReducer, useState } from "react";
import { StateEdge, StateGraph } from "../../../../helpers/designer/graph";
import DesignerPropertiesEdge from "../edges";
import DesignerPropertiesText from "../text";
import DesignerPropertiesTitle from "../title";
import DesignerPropertiesVec2 from "../vec2";
import simulator, { TuringMachineEvent } from "../../../../helpers/designer/simulator";
import DesignerPropertiesCheckbox from "../checkbox";

export default function DesignerPropertiesVertexCombo(props: { graph: StateGraph, id: number }) {
	const [id, setId] = useState(props.id);
	const [graph, setGraph] = useState(props.graph);
	const [vertex, setVertex] = useState(props.graph.getVertex(props.id));
	const [, forceUpdate] = useReducer(x => x + 1, 0);

	useEffect(() => {
		const onTmPropertiesUpdate = () => forceUpdate();

		simulator.addEventListener(TuringMachineEvent.PROPERTIES_UPDATE, onTmPropertiesUpdate);
		return () => simulator.removeEventListener(TuringMachineEvent.PROPERTIES_UPDATE, onTmPropertiesUpdate);
	}, []);

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
		<DesignerPropertiesCheckbox value={vertex.isStart()} prefix="Start?" onChange={val => val ? graph.setStartingNode(id) : graph.unsetStartingNode()} />
		<DesignerPropertiesCheckbox value={vertex.isFinal()} prefix="Final?" onChange={val => vertex.setFinal(val)} />
		<DesignerPropertiesVec2 vec={vertex.getPosition()} prefix="Position" onCommit={vec => vertex.setPosition(vec)} />
		<DesignerPropertiesEdge graph={graph} id={props.id} edges={new Map(outs)} out />
		<DesignerPropertiesEdge graph={graph} id={props.id} edges={new Map(ins)} />
	</>;
}