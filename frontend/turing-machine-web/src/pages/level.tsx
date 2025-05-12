import { useEffect, useState } from "react";
import DesignerLevel from "../components/designer/level";
import LevelTreeCanvas from "../components/level/canvas";
import "../styles/level.css";
import { useNavigate, useParams } from "react-router-dom";
import { Level } from "../helpers/designer/level";
import { getLevel, getLevels } from "../helpers/network";
import Loading from "../components/common/loading";

export default function LevelPage() {
	const params = useParams();
	const navigate = useNavigate();
	
	const [levels, setLevels] = useState<Level[]>();
	const [level, setLevel] = useState<Level>();
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
				if (!levels) setLevel(await getLevel(params.id));
				else setLevel(levels.find(lev => lev.LevelID.toString() == params.id));
				setDetailed(true);
			} catch (err) {
				console.error(err);
			}
		})();
	}, [params.id]);

	if (!levels) return <div className="level-container">
		<Loading enabled />
	</div>;

	const openLevel = async (levelId?: number) => {
		if (levelId === undefined) return;
		navigate(`/level/${levelId}`, { replace: params.id !== undefined });
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