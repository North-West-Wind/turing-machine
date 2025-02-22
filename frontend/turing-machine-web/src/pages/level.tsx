import { useParams } from "react-router-dom";

export default function LevelPage() {
	const params = useParams();

	return <div>TODO: level {params.id}</div>;
}