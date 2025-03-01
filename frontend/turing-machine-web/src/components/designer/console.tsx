import { ChangeEvent, useEffect, useState } from "react";
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

	const [lines, setLines] = useState<{ isInput: boolean, str: string }[]>([]);
	const [lastLine, setLastLine] = useState("");

	const onChange = (ev: ChangeEvent<HTMLTextAreaElement>) => {
		const splits = ev.currentTarget.value.split("\n");
		const lastLineStr = splits.pop()!.slice(2);
		if (splits.length - lines.length >= 1) {
			// enter is pressed
			setLines(lines.concat({ isInput: true, str: splits.pop()!.slice(2) }));
			setLastLine("");
		} else {
			// other key presses
			setLastLine(lastLineStr);
		}
	};
	
	return <div className="designer-bottom" style={{ height: y * factor }}>
		<DesignerResizer onChangeProportion={change => setFactor(initFactor - change)} onSettle={change => setInitFactor(initFactor - change)} />
		<textarea
			className="designer-console"
			value={lines.concat({ isInput: true, str: lastLine }).map(line => `${line.isInput ? "<" : ">"} ${line.str}`).join("\n")}
			onChange={onChange}
			spellCheck={false}
		/>
	</div>;
}