import { LevelContraints, RangeContraints } from "../../../helpers/designer/level";

function capitalize(text: string) {
	let results: string[] = [];
	for (const split of text.split("-"))
		if (split)
			results.push(split.charAt(0).toUpperCase() + split.slice(1));
	return results.join("-");
}

function constraintsToRange(range: RangeContraints) {
	return `${range.min?.toString() || "-inf"} - ${range.max?.toString() || "+inf"}`;
}

export default function DesignerLevelConstraints(props: { constraints: LevelContraints }) {
	if (!props.constraints.heads &&
		!props.constraints.states &&
		(!props.constraints.tapeTypes || props.constraints.tapeTypes.length == 5) &&
		!props.constraints.tapes &&
		!props.constraints.transitions)
		return <div className="designer-level-constraints"><p>This level has no constraints</p></div>;

	const rows: [string, string][] = [];
	if (props.constraints.states) rows.push(["States", `${constraintsToRange(props.constraints.states)}`]);
	if (props.constraints.transitions) rows.push(["Transitions", `${constraintsToRange(props.constraints.transitions)}`]);
	if (props.constraints.tapes) rows.push(["Tapes", `${constraintsToRange(props.constraints.tapes)}`]);
	if (props.constraints.heads) rows.push(["Heads", `${constraintsToRange(props.constraints.heads)}`]);
	if (props.constraints.tapeTypes && props.constraints.tapeTypes.length != 5) rows.push(["Tape Types", props.constraints.tapeTypes.map(capitalize).join(", ")])

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