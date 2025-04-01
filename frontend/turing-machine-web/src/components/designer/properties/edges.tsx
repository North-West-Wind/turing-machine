import { JSX, useState } from "react";
import { StateEdge, StateGraph, StateTransition } from "../../../helpers/designer/graph";
import EditableBox from "../../common/editable";

export default function DesignerPropertiesEdge(props: { graph: StateGraph, id: number, edges: Iterable<[number, StateEdge]>, out?: boolean }) {
	const [collapsed, setCollapsed] = useState(false);

	const baseClassName = `designer-properties-${props.out ? "out" : "in"}`;

	const changeTransition = (dest: number, val: string) => {
		const vertex = props.graph.getVertex(props.id);
		if (!vertex) return;
		const transitions = val.split("|").map(trans => {
			const components = trans.trim().split(",").map(component => component.trim());
			if (components.length == 3) {
				const move = parseInt(components[2]);
				if (!isNaN(move)) return new StateTransition(dest, components[0], components[1], move);
			}
			return null;
		});
		if (transitions.some(trans => !trans)) return;
		vertex.setTransitions(...(transitions as StateTransition[]));
	};

	const list: JSX.Element[] = [];
	for (const [id, edge] of props.edges) {
		let inner: string;
		if (edge.transitions.length == 1) {
			const trans = edge.transitions[0];
			inner = `${trans.read}, ${trans.write}, ${trans.move}`;
		} else {
			inner = edge.transitions.map(trans => `${trans.read}, ${trans.write}, ${trans.move}`).join(" | ");
		}
		list.push(<div className={baseClassName} key={list.length}>
			{props.out && <>
				<select defaultValue={id}>
					{Array.from(props.graph.getVertices()).sort((a, b) => a[0] - b[0]).map(([id, vertex]) => <option value={id}>{id}{vertex.getLabel() ? ` ${vertex.getLabel()}` : ""}</option>)}
				</select>
				<EditableBox value={inner} onCommit={val => changeTransition(id, val)} />
			</>}
			{!props.out && <>From {id}: {inner}</>}
		</div>);
	}

	return <div className="designer-properties-section">
		<div className={`${baseClassName} header`} onClick={() => setCollapsed(!collapsed)}>{collapsed ? "▶" : "▼"} {props.out ? "Out" : "In"}wards Edges</div>
		{!collapsed && list}
	</div>;
}