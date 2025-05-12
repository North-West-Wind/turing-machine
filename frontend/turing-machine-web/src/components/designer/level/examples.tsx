import { LevelTest } from "../../../helpers/designer/level";

export default function DesignerLevelExamples(props: { tests: LevelTest[] }) {
	return <div className="designer-level-examples">
		<h1>Examples</h1>
		{props.tests.map((test, ii) => {
			return <div key={ii}>
				<h2>Input</h2>
				<p>{test.Input}</p>
				<h2>Output</h2>
				<p>{test.Output}</p>
			</div>;
		})}
	</div>;
}