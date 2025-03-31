import { useEffect, useState } from "react";
import useWindowSize from "../../hooks/useWindowSize";
import DesignerResizer from "./resizer";
import DesignerSimulationController from "./simulation/controller";
import DesignerSimulationMachine from "./simulation/machine";
import DesignerPropertiesEmpty from "./properties/empty";
import DesignerPropertiesTitle from "./properties/title";
import DesignerPropertiesEdge from "./properties/edges";
import { Hovered, StateEdge, StateGraph } from "../../helpers/designer/graph";
import DesignerPropertiesText from "./properties/text";
import DesignerPropertiesVec2 from "./properties/vec2";
import simulator, { TuringMachineEvent } from "../../helpers/designer/simulator";
import { TuringMachineConfig } from "../../logic/TuringMachineConfig";

enum Tabs {
	SIMULATION,
	PROPERTIES
}

export default function DesignerSimulation(props: { onWidthChange: (factor: number) => void }) {
	const { x } = useWindowSize();
	const [initFactor, setInitFactor] = useState(0.7);
	const [factor, setFactor] = useState(initFactor);
	useEffect(() => {
		setFactor(initFactor);
	}, [initFactor]);
	useEffect(() => {
		props.onWidthChange(factor);
	}, [factor]);

	const [tab, setTab] = useState(Tabs.SIMULATION);
	const [editing, setEditing] = useState<Hovered | undefined>();
	const [graph, setGraph] = useState<StateGraph | undefined>();
	const [machine, setMachine] = useState<number | undefined>();
	const [machineLength, setMachineLength] = useState(simulator.getMachines().length);
	const tabChanger = (tab: Tabs) => () => setTab(tab);

	useEffect(() => {
		const onTmEdit = (ev: CustomEventInit<Hovered>) => {
			setTab(Tabs.PROPERTIES);
			setEditing(ev.detail);
		};
		const onTmChangeMachine = (ev: CustomEventInit<number>) => {
			if (ev.detail !== undefined) setGraph(simulator.getMachineGraph(ev.detail));
		};
		const onTmChangeMachineLength = (ev: CustomEventInit<number>) => {
			if (ev.detail !== undefined) setMachineLength(ev.detail);
		};

		simulator.addEventListener(TuringMachineEvent.EDIT, onTmEdit);
		simulator.addEventListener(TuringMachineEvent.CHANGE_MACHINE, onTmChangeMachine);
		simulator.addEventListener(TuringMachineEvent.CHANGE_MACHINE_LENGTH, onTmChangeMachineLength);
		return () => {
			simulator.removeEventListener(TuringMachineEvent.EDIT, onTmEdit);
			simulator.removeEventListener(TuringMachineEvent.CHANGE_MACHINE, onTmChangeMachine);
			simulator.removeEventListener(TuringMachineEvent.CHANGE_MACHINE_LENGTH, onTmChangeMachineLength);
		}
	}, []);

	let innerSimulation = <></>;
	switch (tab) {
		case Tabs.SIMULATION:
			innerSimulation = <>
				<DesignerSimulationController paused />
				{simulator.getMachines().map((conf, ii) => {
					if (!conf) return null;
					return <DesignerSimulationMachine
						key={ii}
						name={`M${ii}${machine === ii ? "*" : ""}`}
						color={`#${conf.color}`}
						tapes={conf.TapesReference}
						onClick={() => {
							simulator.dispatchChangeMachineEvent(ii);
							setMachine(ii);
						}}
					/>
				}).filter(conf => !!conf)}
			</>;
			break;
		case Tabs.PROPERTIES:
			if (!graph) break;
			switch (editing?.type) {
				case "vertex":
					const vertex = graph.getVertex(editing.id);
					if (!vertex) break;
					const outs: [number, StateEdge][] = [], ins: [number, StateEdge][] = [];
					graph.getOutEdges(editing.id)?.forEach((edge, dest) => outs.push([dest, edge]));
					graph.getInEdges(editing.id)?.forEach((edge, src) => ins.push([src, edge]));
					innerSimulation = <>
						<DesignerPropertiesTitle value={`Vertex ${editing.id}`} />
						<DesignerPropertiesText value={vertex.getLabel() || ""} prefix="Label" onCommit={value => vertex.setLabel(value)} />
						<DesignerPropertiesVec2 vec={vertex.getPosition()} prefix="Position" onCommit={vec => vertex.setPosition(vec)} key={vertex.id} />
						<DesignerPropertiesEdge edges={outs} out />
						<DesignerPropertiesEdge edges={ins} />
					</>;
					break;
				case "rect":
					const rect = graph.getRect(editing.id);
					if (!rect) break;
					innerSimulation = <>
						<DesignerPropertiesTitle value={`Box ${editing.id}`} />
						<DesignerPropertiesText value={rect.getColor()} prefix="Color" onCommit={value => rect.setColor(value)} />
						<DesignerPropertiesVec2 vec={rect.getStart()} prefix="Start" onCommit={vec => rect.setStart(vec)} key={editing.id} />
						<DesignerPropertiesVec2 vec={rect.getEnd()} prefix="End" onCommit={vec => rect.setEnd(vec)} key={editing.id} />
					</>;
					break;
				case "text":
					const text = graph.getText(editing.id);
					if (!text) break;
					innerSimulation = <>
						<DesignerPropertiesTitle value={`Text ${editing.id}`} />
						<DesignerPropertiesText value={text.getValue()} prefix="Value" onCommit={value => text.setValue(value)} />
						<DesignerPropertiesVec2 vec={text.getPosition()} prefix="Position" onCommit={vec => text.setPosition(vec)} />
					</>;
					break;
				default:
					innerSimulation = <DesignerPropertiesEmpty />
			}
			break;
	}

	return <div className="designer-fill-height designer-left" style={{ width: x * (1 - factor) }}>
		<DesignerResizer vertical onChangeProportion={change => setFactor(initFactor - change)} onSettle={change => setInitFactor(initFactor - change)} />
		<div className="designer-fill-flex designer-simulation" key={machineLength}>
			{innerSimulation}
			<div className="designer-simulation-tab">
				<div className={tab == Tabs.SIMULATION ? "" : "unselected"} onClick={tabChanger(Tabs.SIMULATION)}>Simulation</div>
				<div className={tab == Tabs.PROPERTIES ? "" : "unselected"} onClick={tabChanger(Tabs.PROPERTIES)}>Properties</div>
			</div>
		</div>
	</div>;
}