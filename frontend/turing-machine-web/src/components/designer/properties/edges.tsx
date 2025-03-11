import { JSX, useState } from "react";
import { StateEdge } from "../../../helpers/designer/graph";

export default function DesignerPropertiesEdge(props: { edges: Iterable<[number, StateEdge]>, out?: boolean }) {
	const [collapsed, setCollapsed] = useState(false);

	const baseClassName = `designer-properties-${props.out ? "out" : "in"}`;
	const toFrom = props.out ? "To" : "From";

	const list: JSX.Element[] = [];
	for (const [id, edge] of props.edges) {
		let inner: string;
		if (edge.transitions.length == 1) {
			const trans = edge.transitions[0];
			inner = `${toFrom} ${id}: ${trans.read}, ${trans.write}, ${trans.move}`;
		} else {
			inner = `${toFrom} ${id}:\n`
			inner = edge.transitions.map(trans => `  ${trans.read}, ${trans.write}, ${trans.move}`).join("\n");
		}
		list.push(<div className={baseClassName} key={list.length}>{inner}</div>);
	}

	return <div className="designer-properties-section">
		<div className={`${baseClassName} header`} onClick={() => setCollapsed(!collapsed)}>{collapsed ? "▶" : "▼"} {props.out ? "Out" : "In"}wards Edges</div>
		{!collapsed && list}
	</div>;
}