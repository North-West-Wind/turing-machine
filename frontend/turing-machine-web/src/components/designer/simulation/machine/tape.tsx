import React from "react";

export default function DesignerSimulationMachineTape(props: { values?: string, head: number }) {
	let tape = props.values || "";
	if (tape.length < 7) tape += Array(7 - tape.length).fill("_").join(""); // fill empty character to 7
	tape = tape.slice(props.head - 3, props.head + 3);
	
	const cell: React.ReactNode[] = [];
	for (let ii = 0; ii < tape.length; ii++) {
		let char = tape.charAt(ii);
		if (char == "_") char = "";
		cell.push(<div className={"designer-simulation-cell" + (ii == 3 ? " head" : "")} key={ii}>{char}</div>)
	}

	return <div className="designer-simulation-tape">
		{cell}
	</div>;
}