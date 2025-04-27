import { useEffect, useState } from "react";
import useWindowSize from "../../hooks/useWindowSize";
import DesignerResizer from "./resizer";
import DesignerSimulationController from "./simulation/controller";
import DesignerSimulationMachine from "./simulation/machine";
import DesignerPropertiesEmpty from "./properties/empty";
import { StateGraph } from "../../helpers/designer/graph";
import simulator, { Editable, TuringMachineEvent } from "../../helpers/designer/simulator";
import DesignerPropertiesTextCombo from "./properties/combos/text";
import DesignerPropertiesRectCombo from "./properties/combos/rect";
import DesignerPropertiesVertexCombo from "./properties/combos/vertex";
import DesignerPropertiesMachineCombo from "./properties/combos/machine";
import DesignerSimulationTapes from "./simulation/tapes";

enum Tabs {
	SIMULATION,
	TAPES,
	PROPERTIES
}

export default function DesignerSimulation(props: { onWidthChange: (factor: number) => void, openLevelDetails: () => void }) {
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
	const [editing, setEditing] = useState<Editable | undefined>();
	const [graph, setGraph] = useState<StateGraph | undefined>();
	const [machine, setMachine] = useState<number | undefined>();
	const [machineLength, setMachineLength] = useState(simulator.getMachineConfigs().length);
	const tabChanger = (tab: Tabs) => () => setTab(tab);

	useEffect(() => {
		const onTmEdit = (ev: CustomEventInit<Editable>) => {
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
				{simulator.getMachineConfigs().map((conf, ii) => {
					if (!conf) return null;
					return <DesignerSimulationMachine
						key={ii}
						id={ii}
						name={conf.label ? `${conf.label} (M${ii})` : `M${ii}`}
						color={`#${conf.color}`}
						tapes={conf.TapesReference}
						selected={machine == ii}
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
					innerSimulation = <DesignerPropertiesVertexCombo graph={graph} id={editing.id} />
					break;
				case "rect":
					innerSimulation = <DesignerPropertiesRectCombo graph={graph} id={editing.id} />
					break;
				case "text":
					innerSimulation = <DesignerPropertiesTextCombo graph={graph} id={editing.id} />
					break;
				case "machine":
					innerSimulation = <DesignerPropertiesMachineCombo id={editing.id} />
					break;
				default:
					innerSimulation = <DesignerPropertiesEmpty />
			}
			break;
		case Tabs.TAPES:
			innerSimulation = <DesignerSimulationTapes />
			break;
	}

	return <div className="designer-fill-height designer-left" style={{ width: x * (1 - factor) }}>
		<DesignerResizer vertical onChangeProportion={change => setFactor(initFactor - change)} onSettle={change => setInitFactor(initFactor - change)} />
		<div className="designer-fill-flex designer-simulation" key={machineLength}>
			{innerSimulation}
			<div className="designer-simulation-tab">
				<div className={tab == Tabs.SIMULATION ? "" : "unselected"} onClick={tabChanger(Tabs.SIMULATION)}>Simulation</div>
				<div className={tab == Tabs.TAPES ? "" : "unselected"} onClick={tabChanger(Tabs.TAPES)}>Tapes</div>
				<div className={tab == Tabs.PROPERTIES ? "" : "unselected"} onClick={tabChanger(Tabs.PROPERTIES)}>Properties</div>
				<div className="special" onClick={props.openLevelDetails}>Level</div>
			</div>
		</div>
	</div>;
}