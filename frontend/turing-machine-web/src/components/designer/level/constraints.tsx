import { LevelContraints } from "../../../helpers/designer/level";

function constraintsToRange(min?: number, max?: number) {
	return `${min?.toString() || "-inf"} - ${max?.toString() || "+inf"}`;
}

export default function DesignerLevelConstraints(props: { constraints: LevelContraints }) {
	if (
		props.constraints.MinState === undefined && props.constraints.MaxState === undefined &&
		props.constraints.MinTransition === undefined && props.constraints.MaxTransition === undefined &&
		props.constraints.MinTape === undefined && props.constraints.MaxTape === undefined &&
		props.constraints.MinHead === undefined && props.constraints.MaxHead === undefined &&
		props.constraints.AllowInfinite && props.constraints.AllowLeftLimited &&
		props.constraints.AllowRightLimited && props.constraints.AllowLeftRightLimited &&
		props.constraints.AllowCircular
	) return <div className="designer-level-constraints"><p>This level has no constraints</p></div>;

	const rows: [string, string][] = [];
	if (props.constraints.MinState !== undefined || props.constraints.MaxState !== undefined)
		rows.push(["States", `${constraintsToRange(props.constraints.MinState, props.constraints.MaxState)}`]);
	if (props.constraints.MinTransition !== undefined || props.constraints.MaxTransition !== undefined)
		rows.push(["Transitions", `${constraintsToRange(props.constraints.MinTransition, props.constraints.MaxTransition)}`]);
	if (props.constraints.MinTape !== undefined || props.constraints.MaxTape !== undefined)
		rows.push(["Tapes", `${constraintsToRange(props.constraints.MinTape, props.constraints.MaxTape)}`]);
	if (props.constraints.MinHead !== undefined || props.constraints.MaxHead !== undefined)
		rows.push(["Heads", `${constraintsToRange(props.constraints.MinHead, props.constraints.MaxHead)}`]);
	const tapeTypes: string[] = [];
	if (props.constraints.AllowInfinite) tapeTypes.push("Infinite");
	if (props.constraints.AllowLeftLimited) tapeTypes.push("Left-Limited");
	if (props.constraints.AllowRightLimited) tapeTypes.push("Right-Limited");
	if (props.constraints.AllowLeftRightLimited) tapeTypes.push("Left-Right-Limited");
	if (props.constraints.AllowCircular) tapeTypes.push("Circular");
	if (tapeTypes.length != 5)
		rows.push(["Tape Types", tapeTypes.join(", ")])

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