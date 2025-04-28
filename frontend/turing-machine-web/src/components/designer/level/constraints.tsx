import { LevelContraints } from "../../../helpers/designer/level";

function capitalize(text: string) {
	let results: string[] = [];
	for (const split of text.split("-"))
		if (split)
			results.push(split.charAt(0).toUpperCase() + split.slice(1));
	return results.join("-");
}

export default function DesignerLevelConstraints(props: { constraints: LevelContraints }) {
	if (!props.constraints.heads &&
		!props.constraints.states &&
		!props.constraints.tapeTypes &&
		!props.constraints.tapes &&
		!props.constraints.transitions)
		return <div className="designer-level-constraints"><p>This level has no constraints</p></div>;

	const rows: [string, string][] = [];
	if (props.constraints.states) rows.push(["States", `${props.constraints.states.min} - ${props.constraints.states.max}`]);
	if (props.constraints.transitions) rows.push(["Transitions", `${props.constraints.transitions.min} - ${props.constraints.transitions.max}`]);
	if (props.constraints.tapes) rows.push(["Tapes", `${props.constraints.tapes.min} - ${props.constraints.tapes.max}`]);
	if (props.constraints.heads) rows.push(["Heads", `${props.constraints.heads.min} - ${props.constraints.heads.max}`]);
	if (props.constraints.tapeTypes?.length) rows.push(["Tape Types", props.constraints.tapeTypes.map(capitalize).join(", ")])

	return <div className="designer-level-constraints">
		<div>
			<h1>Constraints</h1>
			<table>
				<tbody>
					{rows.map(row => <tr key={row[0]}><th>{row[0]}</th><td>{row[1]}</td></tr>)}
				</tbody>
			</table>
		</div>
	</div>;
}