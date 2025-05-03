import { useNavigate } from "react-router-dom";

export default function DesignerLevelEmpty() {
	const navigate = useNavigate();

	const selectLevel = () => {
		navigate("/level");
	};

	return <div className="designer-level-empty">
		<div>
			<div><img src="/emoji/confetti.svg" /></div>
			<div>Sandbox Mode!</div>
			<div className="designer-level-play" onClick={selectLevel}>Select a level</div>
		</div>
	</div>;
}