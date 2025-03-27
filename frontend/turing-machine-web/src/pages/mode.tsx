import {useNavigate} from "react-router-dom";
import '../components/mode/mode-select.css'

export default function ModePage() {
	//return <div>TODO: mode</div>;
	const navigate = useNavigate();

	return (
		<>
		<h1>Select a Mode</h1>

		<button className='btn-1' onClick={function(){navigate("/designer")}} >Sandbox</button>
		<br></br>
		<br></br>
		
		<button className='btn-2' onClick={function(){navigate("/level")}}>Level</button>
		<br></br>
		<br></br>
		<button className='btn-3' onClick={function(){navigate("/tutorial")}}>Tutorial</button>	
		</>
	);

}