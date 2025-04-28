import { useEffect, useState } from "react";
import DesignerLevel from "../components/designer/level";
import LevelTreeCanvas from "../components/level/canvas";
import "../styles/level.css";
import { useParams } from "react-router-dom";
import { DetailedLevel, SimpleLevel } from "../helpers/designer/level";

// testing without server
// in production, keep the /api part only
const BASE_URL = "http://localhost:3100/api";

export default function LevelPage() {
	const [levels, setLevels] = useState<SimpleLevel[]>();
	const [level, setLevel] = useState<DetailedLevel>();
	const [detailed, setDetailed] = useState(false);
	const params = useParams();

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch(BASE_URL + "/levels");
				const json = await res.json() as { success: boolean, data: SimpleLevel[] };
				if (!json.success) throw new Error("Unsuccessful server response");
				setLevels(json.data);
			} catch (err) {
				console.error(err);
			}
		})();
	}, []);

	if (!levels) return <div className="level-container">
		Loading
	</div>;

	const openLevel = async (levelId?: string) => {
		if (!levelId) return;
		try {
			const res = await fetch(BASE_URL + "/level/" + levelId);
			const json = await res.json() as { success: boolean, data: DetailedLevel };
			if (!json.success) throw new Error("Unsuccessful server response");
			setLevel(json.data);
			setDetailed(true);
		} catch (err) {
			console.error(err);
		}
	}

	return <div className="level-container">
		<LevelTreeCanvas levels={levels} open={openLevel} />
		<DesignerLevel visible={detailed} level={level} close={() => setDetailed(false)} />
	</div>;
}