import { useEffect, useState } from "react";
import "../../styles/designer/level.css";
import DesignerLevelEmpty from "./level/empty";

const ANIM_LENGTH = 500; // animation length of the container. See styles/designer/level.css

// Level details container
export default function DesignerLevel(props: { visible: boolean }) {
	const [visible, setVisible] = useState(props.visible);
	const [none, setNone] = useState(!props.visible);
	const [noAnim, setNoAnim] = useState(false);
	const [timeoutRef, setTimeoutRef] = useState<number>();

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

	return <div className={"designer-level " + (noAnim ? "" : (visible ? "show" : "dismiss")) + (none ? " display-none" : "")}>
		<DesignerLevelEmpty />
	</div>;
}