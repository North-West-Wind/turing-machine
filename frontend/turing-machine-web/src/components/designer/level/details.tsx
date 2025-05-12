import { useNavigate } from "react-router-dom";
import { Level } from "../../../helpers/designer/level";
import { PersistenceKey, save } from "../../../helpers/persistence";
import simulator from "../../../helpers/designer/simulator";
import Loading from "../../common/loading";
import { useEffect, useState } from "react";
import { createProgress, getLevelProgress, saveMachine, submitMachine } from "../../../helpers/network";

export default function DesignerLevelDetails(props: { level: Level, playable?: boolean }) {
	const [loading, setLoading] = useState(false);
	const [solved, setSolved] = useState<boolean>();
	const [score, setScore] = useState(-1);
	const navigate = useNavigate();

	useEffect(() => {
		getLevelProgress(props.level.LevelID).then(progress => {
			setSolved(!!progress?.IsSolved);
		}).catch(console.error);
	}, []);

	useEffect(() => {
		if (!solved) return;


	}, [solved]);

	const play = () => {
		save(PersistenceKey.LEVEL, JSON.stringify(props.level));
		createProgress(props.level.LevelID).catch(console.error);
		navigate("/designer");
	};

	const back = async () => {
		setLoading(true);
		try {
			const result = await saveMachine(simulator.save(), props.level.LevelID);
			if (result.error && result.message == "INVALID_TOKEN") {
				// Can't save because token expired. Reload
				window.location.reload();
				return;
			}
		} catch (err) {
			console.error(err);
		}
		save(PersistenceKey.LEVEL, undefined);
		setLoading(false);
		navigate("/level");
	};

	const submit = async () => {
		const id = props.level.LevelID;
		if (!id) return;
		setLoading(true);
		const saveable = simulator.save();
		const result = await simulator.test();
		if (result >= 0) {
			await submitMachine(saveable, id);
			setScore(saveable.StateCount + saveable.TransitionCount + saveable.TapeCount + saveable.HeadCount + saveable.OperationCount);
			setSolved(true);
			alert("Correct!");
		} else alert("Incorrect!");
		save(PersistenceKey.LEVEL, JSON.stringify(props.level));
		setLoading(false);
	};

	const maxScore = props.level.MaxStateCount + props.level.MaxTransitionCount + props.level.MaxTapeCount + props.level.MaxHeadCount + props.level.MaxOperationCount;
	const minScore = props.level.MinStateCount + props.level.MinTransitionCount + props.level.MinTapeCount + props.level.MinHeadCount + props.level.MinOperationCount;

	return <div className="designer-level-details">
		<div>
			<h1>{props.level.Title}</h1>
			<h2>ID: {props.level.LevelID}</h2>
			<h2>You have {solved === undefined ? "..." : (solved ? "" : "not ")}solved this level.</h2>
			{score >= 0 && <h2>Solution Performance: {score} (Min: {minScore}, Max: {maxScore})</h2>}
			{props.playable && <div className="designer-level-button play" onClick={play}>Play</div>}
			{!props.playable && <div className="designer-level-details-buttons">
				<div className="designer-level-button upload" onClick={submit}>{solved ? "Re-submit" : "Submit"}</div>
				<div className="designer-level-button play" onClick={back}>Return to Level Select</div>
			</div>}
			{props.level.Descriptions.split("\n").map((text, ii) => <div key={ii}>
				<p>{text}</p>
				<br />
			</div>)}
			{!!props.level.ParentID && <>
				<h2>Previous</h2>
				<p>{props.level.ParentID}</p>
				{/* Figure out title fetching later */}
			</>}
			{!!props.level.ChildrenID.length && <>
				<h2>Next</h2>
				<p>{props.level.ChildrenID.join(", ")}</p>
				{/* Figure out title fetching later */}
			</>}
		</div>
		<Loading enabled={loading} />
	</div>;
}