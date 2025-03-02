import {useNavigate} from "react-router-dom";


export default function ModePage() {
	//return <div>TODO: mode</div>;
	const navigate = useNavigate();

	return (
		<>
			<button onClick={function(){navigate("/designer")}}> Sand box</button>
			<button onClick={function(){navigate("/level")}}>Level</button>	
		</>
	);

}