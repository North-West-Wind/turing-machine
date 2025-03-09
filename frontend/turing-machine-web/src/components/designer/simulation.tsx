import { useEffect, useState } from "react";
import useWindowSize from "../../hooks/useWindowSize";
import DesignerResizer from "./resizer";
import DesignerSimulationController from "./simulation/controller";
import DesignerSimulationMachine from "./simulation/machine";
import DesignerPropertiesEmpty from "./properties/empty";
import DesignerPropertiesTitle from "./properties/title";
import DesignerPropertiesEdge from "./properties/edges";

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
	const [vertex, setVertex] = useState<number | undefined>();
	const tabChanger = (tab: Tabs) => () => setTab(tab);

	useEffect(() => {
		const onVertexEdit = (ev: CustomEventInit<number>) => {
			setTab(Tabs.PROPERTIES);
			setVertex(ev.detail);
		};

		window.addEventListener("tm:vertex-edit", onVertexEdit);
		return () => window.removeEventListener("tm:vertex-edit", onVertexEdit);
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
				{vertex === undefined && <DesignerPropertiesEmpty />}
				{vertex !== undefined && <>
					<DesignerPropertiesTitle id={vertex} />
					<DesignerPropertiesEdge id={vertex} out />
					<DesignerPropertiesEdge id={vertex} />
				</>}
			</>}
			<div className="designer-simulation-tab">
				<div className={tab == Tabs.SIMULATION ? "" : "unselected"} onClick={tabChanger(Tabs.SIMULATION)}>Simulation</div>
				<div className={tab == Tabs.PROPERTIES ? "" : "unselected"} onClick={tabChanger(Tabs.PROPERTIES)}>Properties</div>
			</div>
		</div>
	</div>;
}