import { useEffect, useState } from "react";
import DesignerLevel from "../components/designer/level";
import LevelTreeCanvas from "../components/level/canvas";
import "../styles/level.css";
import { useNavigate, useParams } from "react-router-dom";
import { DetailedLevel, SimpleLevel } from "../helpers/designer/level";
import { getLevel, getLevels } from "../helpers/network";

export default function LevelPage() {
	const params = useParams();
	const navigate = useNavigate();
	
	const [levels, setLevels] = useState<SimpleLevel[]>();
	const [level, setLevel] = useState<DetailedLevel>();
	const [detailed, setDetailed] = useState(!!params.id);

	useEffect(() => {
		(async () => {
			try {
				setLevels(await getLevels());
			} catch (err) {
				console.error(err);
			}
		})();
	}, []);

	useEffect(() => {
		(async () => {
			if (!params.id) {
				setDetailed(false);
				return;
			}
			try {
				setLevel(await getLevel(params.id));
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