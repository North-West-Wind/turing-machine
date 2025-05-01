import { useEffect, useState } from "react";
import DesignerLevel from "../components/designer/level";
import LevelTreeCanvas from "../components/level/canvas";
import "../styles/level.css";
import { useNavigate, useParams } from "react-router-dom";
import { DetailedLevel, SimpleLevel } from "../helpers/designer/level";

// testing without server
// in production, keep the /api part only
const BASE_URL = "http://localhost:3100/api";

export default function LevelPage() {
	const params = useParams();
	const navigate = useNavigate();
	
	const [levels, setLevels] = useState<SimpleLevel[]>();
	const [level, setLevel] = useState<DetailedLevel>();
	const [detailed, setDetailed] = useState(!!params.id);

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

	useEffect(() => {
		if (!params.id) {
			setDetailed(false);
			return;
		}
		(async () => {
			try {
				const res = await fetch(BASE_URL + "/level/" + params.id);
				const json = await res.json() as { success: boolean, data: DetailedLevel };
				if (!json.success) throw new Error("Unsuccessful server response");
				setLevel(json.data);
				setDetailed(true);
			} catch (err) {
				console.error(err);
			}
		})();
	}, [params.id]);

	if (!levels) return <div className="level-container">
		Loading
	</div>;

	const openLevel = async (levelId?: string) => {
		if (!levelId) return;
		navigate(`/level/${levelId}`, { replace: !!params.id });
	}

	const closeLevel = () => {
		navigate(-1);
	};

	const onClosed = () => {
		setLevel(undefined);
	};

	return <div className="level-container">
		<LevelTreeCanvas levels={levels} open={openLevel} />
		<DesignerLevel visible={detailed} level={level} close={closeLevel} onClosed={onClosed} />
	</div>;
}