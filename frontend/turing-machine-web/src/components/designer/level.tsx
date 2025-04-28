import { useEffect, useState } from "react";
import "../../styles/designer/level.css";
import DesignerLevelEmpty from "./level/empty";
import { DetailedLevel } from "../../helpers/designer/level";
import DesignerLevelDetails from "./level/details";
import DesignerLevelConstraints from "./level/constraints";
import DesignerLevelExamples from "./level/examples";

const ANIM_LENGTH = 500; // animation length of the container. See styles/designer/level.css

// Level details container
export default function DesignerLevel(props: { visible: boolean, close: () => void }) {
	const [visible, setVisible] = useState(props.visible);
	const [none, setNone] = useState(!props.visible);
	const [noAnim, setNoAnim] = useState(false);
	const [timeoutRef, setTimeoutRef] = useState<number>();

	useEffect(() => {
		const onKeyDown = (ev: KeyboardEvent) => {
			if (ev.key == "Escape") {
				ev.preventDefault();
				props.close();
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);
	
	let parsedLevel: DetailedLevel | undefined;
	const storedLevel = window.localStorage.getItem("tm:level");
	if (storedLevel) {
		try {
			parsedLevel = JSON.parse(storedLevel);
		} catch (err) {
			console.error(err);
		}
	}
	const [level] = useState(parsedLevel);

	useEffect(() => {
		if (props.visible) {
			setVisible(true);
			setNone(false);
			setNoAnim(false);
			if (timeoutRef) clearTimeout(timeoutRef);
			setTimeoutRef(setTimeout(() => {
				setNoAnim(true);
				setTimeoutRef(undefined);
			}, ANIM_LENGTH));
		} else {
			setVisible(false);
			setNoAnim(false);
			if (timeoutRef) clearTimeout(timeoutRef);
			setTimeoutRef(setTimeout(() => {
				setNone(true);
				setNoAnim(true);
				setTimeoutRef(undefined);
			}, ANIM_LENGTH));
		}
	}, [props.visible]);

	if (!level) return <div className={"designer-level " + (noAnim ? "" : (visible ? "show" : "dismiss")) + (none ? " display-none" : "")}>
		<div className="designer-level-close" onClick={() => props.close()}><img src="/ui/cross.svg" /></div>
		<DesignerLevelEmpty />
	</div>;

	return <div className={"designer-level " + (noAnim ? "" : (visible ? "show" : "dismiss")) + (none ? " display-none" : "")}>
		<div className="designer-level-close" onClick={() => props.close()}><img src="/ui/cross.svg" /></div>
		<div className="designer-level-inner">
			<div className="designer-level-left">
				<DesignerLevelDetails level={level} />
				<DesignerLevelConstraints constraints={level.constraints} />
			</div>
			<div className="designer-level-right">
				<DesignerLevelExamples tests={level.tests} />
			</div>
		</div>
	</div>;
}