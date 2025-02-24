import { useEffect, useState } from "react";
import useWindowSize from "../../hooks/useWindowSize";
import DesignerResizer from "./resizer";

export default function DesignerConsole(props: { onHeightChange: (factor: number) => void }) {
	const { y } = useWindowSize();
	const [initFactor, setInitFactor] = useState(0.3);
	const [factor, setFactor] = useState(0.3);
	useEffect(() => {
		setFactor(initFactor);
	}, [initFactor]);
	useEffect(() => {
		props.onHeightChange(factor);
	}, [factor]);
	return <div className="designer-bottom" style={{ height: y * factor }}>
		<DesignerResizer onChangeProportion={change => setFactor(initFactor - change)} onSettle={change => setInitFactor(initFactor - change)} />
	</div>;
}