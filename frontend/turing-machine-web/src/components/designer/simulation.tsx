import { useEffect, useState } from "react";
import useWindowSize from "../../hooks/useWindowSize";
import DesignerResizer from "./resizer";
import DesignerSimulationController from "./simulation/controller";
import DesignerSimulationMachine from "./simulation/machine";
import DesignerPropertiesEmpty from "./properties/empty";
import DesignerPropertiesTitle from "./properties/title";
import DesignerPropertiesEdge from "./properties/edges";
import { Hovered } from "../../helpers/designer/graph";

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
	const tabChanger = (tab: Tabs) => () => setTab(tab);

	useEffect(() => {
		const onTmEdit = (ev: CustomEventInit<Hovered>) => {
			setTab(Tabs.PROPERTIES);
			setEditing(ev.detail);
		};

		window.addEventListener("tm:edit", onTmEdit);
		return () => window.removeEventListener("tm:edit", onTmEdit);
	}, []);

	return <div className="designer-fill-height designer-left" style={{ width: x * (1 - factor) }}>
		<DesignerResizer vertical onChangeProportion={change => setFactor(initFactor - change)} onSettle={change => setInitFactor(initFactor - change)} />
		<div className="designer-fill-flex designer-simulation">
			{tab == Tabs.SIMULATION && <>
				<DesignerSimulationController paused />
				{/* Currently hardcoded for testing purposes. Need to integrate with logic components later */}
				<DesignerSimulationMachine name="M1" color="#845884" tapes={["_______", "_a__ab_"]} />
				<DesignerSimulationMachine name="M2" color="#55846a" tapes={["_c_"]} />
			</>}
			{tab == Tabs.PROPERTIES && <>
				{editing === undefined && <DesignerPropertiesEmpty />}
				{editing?.type == "vertex" && <>
					<DesignerPropertiesTitle prefix="Vertex" id={editing.id} />
					<DesignerPropertiesEdge id={editing.id} out />
					<DesignerPropertiesEdge id={editing.id} />
				</>}
				{editing?.type == "rect" && <>
					<DesignerPropertiesTitle prefix="Box" id={editing.id} />
				</>}
			</>}
			<div className="designer-simulation-tab">
				<div className={tab == Tabs.SIMULATION ? "" : "unselected"} onClick={tabChanger(Tabs.SIMULATION)}>Simulation</div>
				<div className={tab == Tabs.PROPERTIES ? "" : "unselected"} onClick={tabChanger(Tabs.PROPERTIES)}>Properties</div>
			</div>
		</div>
	</div>;
}