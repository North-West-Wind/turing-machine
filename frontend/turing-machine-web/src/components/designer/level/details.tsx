import { useNavigate } from "react-router-dom";
import { DetailedLevel, SimpleLevel } from "../../../helpers/designer/level";
import { getRanks, PersistenceKey, save } from "../../../helpers/persistence";
import simulator from "../../../helpers/designer/simulator";
import Loading from "../../common/loading";
import { useEffect, useState } from "react";
import { getLevelStat, saveToCloud, submitMachine } from "../../../helpers/network";
import { lazyLevels } from "../../../helpers/lazy";

export default function DesignerLevelDetails(props: { level: DetailedLevel, playable?: boolean }) {
	const [loading, setLoading] = useState(false);
	const [solved, setSolved] = useState(props.level.isSolved);
	const [rank, setRank] = useState(-1);
	const [levels, setLevels] = useState(new Map<number, SimpleLevel>());
	const navigate = useNavigate();

	useEffect(() => {
		lazyLevels.get().then(simpleLevels => {
			simpleLevels.forEach(level => levels.set(level.levelID, level));
			setLevels(new Map(levels));
		});
	}, []);

	useEffect(() => {
		if (!solved) return;
		const ranks = getRanks();
		if (ranks && ranks[props.level.levelID]) setRank(ranks[props.level.levelID]);
		getLevelStat(props.level.levelID).then((percentage) => {
			if (typeof percentage == "number") setRank(percentage);
		}).catch(console.error); 
	}, [solved]);

	const play = () => {
		save(PersistenceKey.LEVEL, JSON.stringify(props.level));
		navigate("/designer");
	};

	const back = async () => {
		setLoading(true);
		try {
			const result = await saveToCloud(simulator.save());
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
		const id = props.level.levelID;
		if (id === undefined) return;
		setLoading(true);
		const saveable = simulator.save();
		const result = await simulator.test();
		if (result >= 0) {
			const rank = await submitMachine(saveable, result, id);
			setRank(rank);
			props.level.isSolved = true;
			setSolved(true);
			alert("Correct!");
		} else alert("Incorrect!");
		save(PersistenceKey.LEVEL, JSON.stringify(props.level));
		setLoading(false);
	};

	return <div className="designer-level-details">
		<div>
			<h1>{props.level.title}</h1>
			<h2>ID: {props.level.levelID}</h2>
			<h2>You have {props.level.isSolved ? "" : "not "}solved this level.</h2>
			{rank >= 0 && <h2>Solution Performance: {(rank * 100).toFixed(2)}%</h2>}
			{props.playable && <div className="designer-level-button play" onClick={play}>Play</div>}
			{!props.playable && <div className="designer-level-details-buttons">
				<div className="designer-level-button upload" onClick={submit}>{solved ? "Re-submit" : "Submit"}</div>
				<div className="designer-level-button play" onClick={back}>Return to Level Select</div>
			</div>}
			{props.level.description.split("\n").map((text, ii) => <div key={ii}>
				<p>{text}</p>
				<br />
			</div>)}
			{!!props.level.parents.length && <>
				<h2>Previous</h2>
				<p>{props.level.parents.map(id => levels.get(id)?.title).filter(title => !!title).join(", ")}</p>
			</>}
			{!!props.level.children.length && <>
				<h2>Next</h2>
				<p>{props.level.children.map(id => levels.get(id)?.title).filter(title => !!title).join(", ")}</p>
			</>}
		</div>
		<Loading enabled={loading} />
	</div>;
}