import { ChangeEvent, KeyboardEvent, UIEvent, useEffect, useRef, useState } from "react";
import useWindowSize from "../../hooks/useWindowSize";
import DesignerResizer from "./resizer";
import simulator, { TuringMachineEvent } from "../../helpers/designer/simulator";
import ConsoleCommand from "./commands/base";
import ClearCommand from "./commands/clear";
import InputCommand from "./commands/input";
import HelpCommand from "./commands/help";
import InfoCommand from "./commands/info";

const commands = new Map<string, ConsoleCommand>();
new ClearCommand().addToMap(commands);
new HelpCommand().addToMap(commands);
new InputCommand().addToMap(commands);
new InfoCommand().addToMap(commands);

enum LineType {
	NORMAL = -1,
	MACHINE = 0xffb433,
	IO = 0x71ff18,
	WARNING = 0xfff200,
	ERROR = 0xff5100
}

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

	const [input, setInput] = useState("> ");
	const [autoscroll, setAutoscroll] = useState(true);
	const [lines, setLines] = useState<{ type: LineType, str: string }[]>([]);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const addLine = (str: string, type?: LineType) => {
			setLines(lines => [...lines, { type: type || LineType.MACHINE, str }]);
		};

		const onTmStart = () => addLine("Simulation started");
		const onTmStop = () => addLine("Simulation stopped");
		const onTmHalt = (ev: CustomEventInit<number>) => ev.detail !== undefined && addLine(`Machine ${ev.detail} halted`);
		const onTmWarn = (ev: CustomEventInit<string>) => ev.detail !== undefined && addLine(ev.detail, LineType.WARNING);

		simulator.addEventListener(TuringMachineEvent.START, onTmStart);
		simulator.addEventListener(TuringMachineEvent.STOP, onTmStop);
		simulator.addEventListener(TuringMachineEvent.HALT, onTmHalt);
		simulator.addEventListener(TuringMachineEvent.WARN, onTmWarn);
		return () => {
			simulator.removeEventListener(TuringMachineEvent.START, onTmStart);
			simulator.removeEventListener(TuringMachineEvent.STOP, onTmStop);
			simulator.removeEventListener(TuringMachineEvent.HALT, onTmHalt);
			simulator.removeEventListener(TuringMachineEvent.WARN, onTmWarn);
		};
	}, []);

	useEffect(() => {
		if (autoscroll) scrollRef.current?.scrollIntoView();
	}, [lines]);

	const onChange = (ev: ChangeEvent<HTMLInputElement>) => {
		let changed = ev.currentTarget.value;
		if (changed.length < 2) setInput("> ");
		else if (!changed.startsWith("> ")) {
			const index = changed.indexOf("> ");
			if (index < 0) changed = "> " + changed;
			else changed = "> " + changed.slice(0, index) + changed.slice(index + 2);
			setInput(changed);
		} else setInput(changed);
	};

	const onEnter = (ev: KeyboardEvent<HTMLInputElement>) => {
		if (ev.key == "Enter" && input.length > 2) {
			const newLines = [...lines, { type: LineType.IO, str: ">" + input }];
			setLines([...lines, { type: LineType.IO, str: ">" + input }]);
			const sliced = input.slice(2);
			if (sliced.startsWith("/")) {
				// command handler
				const split = sliced.slice(1).split(/\s+/g);
				const command = commands.get(split.shift()!);
				if (!command) newLines.push({ type: LineType.ERROR, str: "Unknown command " + sliced });
				else newLines.push(...command.handle(split, Array.from(commands.values())).map(str => ({ type: LineType.NORMAL, str })));
			} else {
				if (ConsoleCommand.modifyingTape >= 0) simulator.appendTapeContent(sliced, ConsoleCommand.modifyingTape);
				else simulator.appendInput(sliced);
			}
			setLines(newLines);
			setInput("> ");
		}
	};

	const onScroll = (ev: UIEvent<HTMLDivElement>) => {
		setAutoscroll(Math.abs(ev.currentTarget.scrollHeight - ev.currentTarget.scrollTop - ev.currentTarget.clientHeight) < 1);
	};
	
	return <div className="designer-bottom" style={{ height: y * factor }}>
		<DesignerResizer onChangeProportion={change => setFactor(initFactor - change)} onSettle={change => setInitFactor(initFactor - change)} />
		<div className="designer-console" onScroll={onScroll}>
			<div>
				{lines.map((line, ii) => <p style={{ color: "#" + line.type.toString(16).padStart(6, "0") }} key={ii}>{line.str}</p>)}
				<div ref={scrollRef}></div> {/* dummy for scrolling */}
			</div>
		</div>
		<input
			className="designer-console-input"
			value={input}
			onChange={onChange}
			onKeyDown={onEnter}
		/>
	</div>;
}