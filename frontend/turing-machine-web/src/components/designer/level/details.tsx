import { useNavigate } from "react-router-dom";
import { DetailedLevel } from "../../../helpers/designer/level";
import { getLevel, PersistenceKey, save } from "../../../helpers/persistence";
import simulator from "../../../helpers/designer/simulator";
import Loading from "../../common/loading";
import { useState } from "react";
import { saveToCloud, submitMachine } from "../../../helpers/network";

export default function DesignerLevelDetails(props: { level: DetailedLevel, playable?: boolean }) {
	const [loading, setLoading] = useState(false);
	const [solved, setSolved] = useState(props.level.solved);
	const navigate = useNavigate();

	const play = () => {
		save(PersistenceKey.LEVEL, JSON.stringify(props.level));
		navigate("/designer");
	};

	const back = async () => {
		setLoading(true);
		await saveToCloud(simulator.save());
		save(PersistenceKey.LEVEL, undefined);
		setLoading(false);
		navigate("/level");
	};

	const submit = async () => {
		const id = getLevel()?.id;
		if (!id) return;
		setLoading(true);
		const result = await submitMachine(simulator.save(), id);
		if (result.correct) {
			props.level.solved = true;
			setSolved(true);
			alert("Correct!");
		} else alert("Incorrect!");
		save(PersistenceKey.LEVEL, JSON.stringify(props.level));
		setLoading(false);
	};

	return <div className="designer-level-details">
		<div>
			<h1>{props.level.title}</h1>
			<h2>ID: {props.level.id}</h2>
			<h2>You have {props.level.solved ? "" : "not "}solved this level.</h2>
			{props.playable && <div className="designer-level-play" onClick={play}>Play</div>}
			{!props.playable && <div className="designer-level-details-buttons">
				<div className="designer-level-button upload" onClick={submit}>{solved ? "Re-submit" : "Submit"}</div>
				<div className="designer-level-button play" onClick={back}>Return to Level Select</div>
			</div>}
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
		<Loading enabled={loading} />
	</div>;
}