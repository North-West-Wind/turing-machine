import { JSX, useEffect, useReducer, useState } from "react";
import { StateEdge, StateGraph, StateTransition } from "../../../helpers/designer/graph";
import EditableBox from "../../common/editable";
import { TapeSymbols } from "../../../logic/Tapes/TapesUtilities/TapeSymbols";
import simulator, { TuringMachineEvent } from "../../../helpers/designer/simulator";

export default function DesignerPropertiesEdge(props: { graph: StateGraph, id: number, edges: Map<number, StateEdge>, out?: boolean }) {
	const [collapsed, setCollapsed] = useState(false);
	const [innerCollapsed, setInnerCollapsed] = useState(new Set<number>());
	const [, forceUpdate] = useReducer(x => x + 1, 0);

	useEffect(() => {
		const onTmPropertiesUpdate = () => forceUpdate();

		simulator.addEventListener(TuringMachineEvent.PROPERTIES_UPDATE, onTmPropertiesUpdate);
		return () => simulator.removeEventListener(TuringMachineEvent.PROPERTIES_UPDATE, onTmPropertiesUpdate);
	}, []);

	const baseClassName = `designer-properties-${props.out ? "out" : "in"}`;

	const changeTransition = (dest: number, val: string, index: number, component: number) => {
		if (component < 0 || component > 2) return;
		const found = props.edges.get(dest);
		if (!found) return;
		const trans = found.transitions[index];
		if (val.startsWith("(")) val = val.slice(1);
		if (val.endsWith(")")) val = val.slice(0, -1);
		const split = val.split(/,\s*/g);
		switch (component) {
			case 0:
				if (trans.read.length == split.length)
					for (let ii = 0; ii < split.length; ii++)
						trans.read[ii] = split[ii];
				break;
			case 1:
				if (trans.write.length == split.length)
					for (let ii = 0; ii < split.length; ii++)
						trans.write[ii] = split[ii];
				break;
			case 2:
				if (trans.move.length == split.length)
					for (let ii = 0; ii < split.length; ii++) {
						const parsed = parseInt(split[ii]);
						if (isNaN(parsed)) break;
						trans.move[ii] = parsed;
					}
				break;
		}
	};

	const toggleCollapsed = (id: number) => {
		if (innerCollapsed.has(id)) innerCollapsed.delete(id);
		else innerCollapsed.add(id);
		setInnerCollapsed(new Set(innerCollapsed));
	};

	const addTransition = (dest: number) => {
		const heads = props.edges.get(Array.from(props.edges.keys())[0])!.transitions[0].read.length;
		const transition = new StateTransition(dest, Array(heads).fill(TapeSymbols.Blank), Array(heads).fill(TapeSymbols.Blank), Array(heads).fill(0));
		props.graph.getVertex(props.id)?.addTransitions(transition);
		// props.edges.get(dest)?.addTransition(transition);
		simulator.dispatchPropertiesUpdateEvent();
	};

	const deleteTransition = (dest: number, index: number) => {
		const edge = props.edges.get(dest);
		if (!edge) return;
		const deleted = edge.deleteTransition(index);
		if (deleted)
			props.graph.getVertex(props.id)?.deleteTransition(deleted);
		console.log("same edge?", edge == props.graph.getEdge(props.id, dest));
		if (edge.transitions.length == 0) {
			props.graph.deleteEdge(props.id, dest);
			props.edges.delete(dest);
		}
		simulator.dispatchPropertiesUpdateEvent();
	};

	const list: JSX.Element[] = [];
	for (const [id, edge] of props.edges) {
		let inner: string;
		if (edge.transitions.length == 1) inner = edge.transitions[0].toEdgeString();
		else inner = edge.transitions.map(trans => trans.toEdgeString()).join(" | ");

		if (!props.out) {
			list.push(<div className={baseClassName} key={list.length}>
				From {id}: {inner}
			</div>);
			continue;
		}

		if (innerCollapsed.has(id)) {
			list.push(<div className={baseClassName + " top"} onClick={() => toggleCollapsed(id)} key={list.length}>
				▶ To {id}: {inner}
			</div>);
		} else {
			list.push(<>
				<div className={baseClassName + " top-container"}>
					<div className={baseClassName + " top"} onClick={() => toggleCollapsed(id)} key={list.length}>
						▼ To {id}:
					</div>
					<div className={baseClassName + " add"} onClick={() => addTransition(id)}>
						Add
					</div>
				</div>
				{edge.transitions.map((trans, ii) => {
					let split = trans.toEdgeString().split(/,\s*/g);
					if (split.length > 3) {
						// multihead
						const heads = split.length / 3;
						const newSplit: string[] = [];
						for (let ii = 0; ii < split.length; ii += heads)
							newSplit.push(split.slice(ii, ii + heads).join(", "));
						split = newSplit;
					}
					return <div className={baseClassName + " edge"} key={ii}>
						<EditableBox className="edge" value={split[0]} onCommit={val => changeTransition(id, val, ii, 0)} />
						<EditableBox className="edge" value={split[1]} onCommit={val => changeTransition(id, val, ii, 1)} />
						<EditableBox className="edge" value={split[2]} onCommit={val => changeTransition(id, val, ii, 2)} />
						<div className="delete" onClick={() => deleteTransition(id, ii)}>Delete</div>
					</div>
				})}
			</>);
		}
	}

	return <div className="designer-properties-section">
		<div className={`${baseClassName} header`} onClick={() => setCollapsed(!collapsed)}>{collapsed ? "▶" : "▼"} {props.out ? "Out" : "In"}wards Edges</div>
		{!collapsed && list}
	</div>;
}