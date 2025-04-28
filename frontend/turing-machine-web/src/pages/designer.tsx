import "../styles/designer.css";
import DesignerSimulation from "../components/designer/simulation";
import DesignerConsole from "../components/designer/console";
import DesignerGraph from "../components/designer/graph";
import { useState } from "react";
import DesignerLevel from "../components/designer/level";

export default function DesignerPage() {
	const [rightWidth, setRightWidth] = useState(0.7);
	const [topHeight, setTopHeight] = useState(0.7);
	const [detailed, setDetailed] = useState(false);

	return <div className="designer-container">
		<DesignerSimulation onWidthChange={setRightWidth} openLevelDetails={() => setDetailed(true)} />
		<div className="designer-fill-height designer-fill-flex designer-right" style={{ width: rightWidth * window.innerWidth }}>
			<DesignerConsole onHeightChange={factor => setTopHeight(1 - factor)} />
			<DesignerGraph width={rightWidth} height={topHeight} />
		</div>
		<DesignerLevel visible={detailed} close={() => setDetailed(false)} />
	</div>;
}