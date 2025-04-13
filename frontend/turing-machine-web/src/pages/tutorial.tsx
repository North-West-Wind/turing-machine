import {useNavigate} from "react-router-dom";
import Tape from '../components/tutorial/OurTape.png'
import head from '../components/tutorial/head.png'
import Time0 from '../components/tutorial/Time0.png'
import Time1 from '../components/tutorial/Time1.png'
import arrow from '../components/tutorial/arrow.png'
import Ses from '../components/tutorial/States.png'
import vid from '../components/tutorial/demostration.mp4'

export default function TutorialPage() {
	//return <div>TODO: tutorial</div>;
	const navigate = useNavigate();

	return (
	<>
		<h1> Tutorial </h1>
		<button className='commonButton' onClick={function(){navigate("/mode")}} >ChooseMode</button>
		<br></br>
		<br></br>
		<img src={Tape}/>
		<p>Weclome! The top picture is our Turing machine. But it may be difficult for beginers to understand initially.</p>
		<p>But no worry, this tutorial aims to give a basic guide for you. First, we shall start from theory.</p>

		<h2>|Head pointer|</h2>
		<img src={head}/>
		<p>In each unit of time, the head has 3 steps. </p>
		<ul>
			<li>1. reads a symbol. (these symbols are initial symbols defined by user)</li>
			<li>2. Writes a symbol (Change the symbol base on previously read)</li>
			<li>3. The head move left or right</li>
		</ul>
		<img src={Time0}/>&nbsp;&nbsp;
		<img src={Time1}/>
		<p>Please remember the above two pictures. We will refer it many times.</p>

		<h2>|Transition function|</h2>
		<img src={arrow}/>
		<p>We can use an arrow to describe the above transition. The 3 parameters represent correspond 3 steps: (1), (2), (3) </p>
		<p>In this website, we define 0 as left, 1 as right.</p>
		
		<h2>|State|</h2>
		<p>A state can carry multiple transitions with arrows. The start and end of arrow represent the transition of state, not by the parameters.</p>
		<img src={Ses} />

		<h2>These are the basic! Feel free go to designer page and practice. Next, we will begin to introduce UI. </h2>
		<video controls src={vid} width = "500"/>
		<p>Steps to follow</p>
		<ul>
			<li>1. Click the left "+"" button to create a turing machine. It will give a state in default</li>
			<li>2. We need to add more state. Click the top right "+"" button to do so</li>
			<li>3. We need to add arrow. Click the top right </li>
			<li>4. Double click on the state "0". It opens the property of that state for you</li>
			<li>5. In that property, change the outwardedges for defining the parameters</li>
			<li>6. Click the bottom right simulation. Then click edit. </li>
			<li>7. Click "Add" and set read-write</li>
			<li>8. Use the below command prompt. This is how user define the initial symbols</li>
			<li>9. Now you can click the start buttom on the top left and begin the simulation</li>
		</ul>
		

		<br></br>
		<button className='commonButton' onClick={function(){navigate("/mode")}} >ChooseMode</button>

	</>
	);
}