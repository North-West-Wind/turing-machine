import "../styles/designer.css";
import DesignerSimulation from "../components/designer/simulation";
import DesignerConsole from "../components/designer/console";
import DesignerGraph from "../components/designer/graph";
import { useEffect, useState } from "react";
import DesignerLevel from "../components/designer/level";
import simulator from "../helpers/designer/simulator";
import { saveToCloud } from "../helpers/network";

export default function DesignerPage() {
	const [rightWidth, setRightWidth] = useState(0.7);
	const [topHeight, setTopHeight] = useState(0.7);
	const [detailed, setDetailed] = useState(false);
	const [status, setStatus] = useState<string>();

	useEffect(() => {
		simulator.load();

		const onKeyDown = (ev: KeyboardEvent) => {
			if (ev.ctrlKey && ev.key == "s") {
				ev.preventDefault();
				setStatus("Saving...");
				const saveable = simulator.save();
				setStatus("Saved locally! Saving to cloud...");
				saveToCloud(saveable).then(res => {
					if (res.error) {
						setStatus("Saved locally!");
						console.error(res.message);
					} else setStatus("Saved to cloud!");
				}).catch(err => {
					console.error(err);
					setStatus("Saved locally!");
				});
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	useEffect(() => {
		// reset status so we can send another status later
		if (status) setStatus(undefined);
	}, [status]);

	return <div className="designer-container">
		<DesignerSimulation onWidthChange={setRightWidth} openLevelDetails={() => setDetailed(true)} />
		<div className="designer-fill-height designer-fill-flex designer-right" style={{ width: rightWidth * window.innerWidth }}>
			<DesignerConsole onHeightChange={factor => setTopHeight(1 - factor)} />
			<DesignerGraph width={rightWidth} height={topHeight} status={status} />
		</div>
		<DesignerLevel visible={detailed} close={() => setDetailed(false)} />
	</div>;
}