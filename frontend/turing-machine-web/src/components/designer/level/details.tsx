import { DetailedLevel } from "../../../helpers/designer/level";

export default function DesignerLevelDetails(props: { level: DetailedLevel }) {
	return <div className="designer-level-details">
		<div>
			<h1>{props.level.title}</h1>
			<h2>ID: {props.level.id}</h2>
			<h2>You have {props.level.solved ? "" : "not "}solved this level.</h2>
			{props.level.description.split("\n").map((text, ii) => <div key={ii}>
				<p>{text}</p>
				<br />
			</div>)}
			<h2>Previous</h2>
			<p>{props.level.parent}</p>
			{props.level.children.length && <>
				<h2>Next</h2>
				<p>{props.level.children.join(", ")}</p>
			</>}
		</div>
	</div>;
}