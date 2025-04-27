import { ChangeEvent, useEffect, useRef, useState } from "react";
import useWindowSize from "../../hooks/useWindowSize";
import DesignerResizer from "./resizer";
import simulator, { TuringMachineEvent } from "../../helpers/designer/simulator";

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
	const ref = useRef(null);

	useEffect(() => {
		const addLine = (str: string) => {
			lines.push({ isInput: false, str });
			setLines(Array.from(lines));
		};

		const onTmStart = () => addLine("Simulation started");
		const onTmStop = () => addLine("Simulation stopped");
		const onTmHalt = (ev: CustomEventInit<number>) => ev.detail !== undefined && addLine(`Machine ${ev.detail} halted`);

		simulator.addEventListener(TuringMachineEvent.START, onTmStart);
		simulator.addEventListener(TuringMachineEvent.STOP, onTmStop);
		simulator.addEventListener(TuringMachineEvent.HALT, onTmHalt);
		return () => {
			simulator.removeEventListener(TuringMachineEvent.START, onTmStart);
			simulator.removeEventListener(TuringMachineEvent.STOP, onTmStop);
			simulator.removeEventListener(TuringMachineEvent.HALT, onTmHalt);
		};
	}, []);

	const onChange = (ev: ChangeEvent<HTMLTextAreaElement>) => {
		const splits = ev.currentTarget.value.split("\n");
		const lastLineStr = splits.pop()!.slice(2);
		if (splits.length - lines.length >= 1) {
			// enter is pressed
			const line = splits.pop()!.slice(2);
			simulator.appendInput(line);
			setLines(lines.concat({ isInput: true, str: line }));
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
			ref={ref}
		/>
	</div>;
}