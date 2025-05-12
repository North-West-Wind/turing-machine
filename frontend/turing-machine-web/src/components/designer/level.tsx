import { useEffect, useState } from "react";
import "../../styles/designer/level.css";
import DesignerLevelEmpty from "./level/empty";
import { Level } from "../../helpers/designer/level";
import DesignerLevelDetails from "./level/details";
import DesignerLevelConstraints from "./level/constraints";
import DesignerLevelExamples from "./level/examples";
import DesignerLevelActions from "./level/actions";

const ANIM_LENGTH = 500; // animation length of the container. See styles/designer/level.css

// Level details container
export default function DesignerLevel(props: { visible: boolean, close: () => void, level?: Level, onClosed?: () => void }) {
	const [visible, setVisible] = useState(props.visible);
	const [none, setNone] = useState(!props.visible);
	const [noAnim, setNoAnim] = useState(false);
	const [timeoutRef, setTimeoutRef] = useState<ReturnType<typeof setTimeout>>();

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

	const getEitherLevel = () => {
		if (props.level) return props.level;
		else {
			const storedLevel = window.localStorage.getItem("tm:level");
			if (storedLevel) {
				try {
					return JSON.parse(storedLevel) as Level;
				} catch (err) {
					console.error(err);
				}
			}
		}
	};

	const [level, setLevel] = useState(getEitherLevel());

	
	useEffect(() => {
		setLevel(getEitherLevel());
	}, [props.level]);

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
				if (props.onClosed) props.onClosed();
			}, ANIM_LENGTH));
		}
	}, [props.visible]);

	if (!level) return <div className={"designer-level " + (noAnim ? "" : (visible ? "show" : "dismiss")) + (none ? " display-none" : "")}>
		<div className="designer-level-close" onClick={() => props.close()}><img src="/ui/cross.svg" /></div>
		<DesignerLevelEmpty />
		<DesignerLevelActions />
	</div>;

	return <div className={"designer-level " + (noAnim ? "" : (visible ? "show" : "dismiss")) + (none ? " display-none" : "")}>
		<div className="designer-level-close" onClick={() => props.close()}><img src="/ui/cross.svg" /></div>
		<div className="designer-level-inner">
			<div className="designer-level-left">
				<DesignerLevelDetails level={level} playable={!!props.level} />
				<DesignerLevelConstraints constraints={level.Constraint} />
			</div>
			<div className="designer-level-right">
				<DesignerLevelExamples tests={level.Testcases} />
			</div>
		</div>
	</div>;
}