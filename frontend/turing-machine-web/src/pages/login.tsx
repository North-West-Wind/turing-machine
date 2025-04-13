import Login_box from '../components/login/login-box'
import LoginArrangement from '../components/login/login-arrange';
import {useState} from 'react';
import '../styles/login-decoration.css'

export default function LoginPage() {
	// This one is driven by button
	const [isToggled, setIsToggled] = useState<boolean>(false);
	let registerNback = isToggled ? "Back" : "Register";
	let header = isToggled ? "Registration" : "Login";

	// Three const are interrupt driven variable by input box
	const [User, saveUser] = useState<string>('');
	const [Pw, savePw] = useState<string>('');
	const [Key, saveKey] = useState<string>('');
	// Updater functions for the three once triggered interrupt
	function UserChange(value:string){saveUser(value);}
	function PwChange(value: string){savePw(value);}
	function KeyChange(value: string){saveKey(value);}
	/*
	<div className='login'>
	<h2>Username</h2>
	<h2>Password</h2>
	*/
	return (
		<div className='box'>
			<h1> {header}</h1>
			<br></br>
			<Login_box BoxChange={UserChange} default_holder='Your name' />
			<br/>
			<br/>

			<Login_box BoxChange={PwChange} default_holder='Password'/>
			<br/>
			<br/>
			
			{
				isToggled ?
				<div>
					<Login_box BoxChange={KeyChange} default_holder='License Key'/>
					<br></br>
					<br></br>
				</div>
				:
				<></> 
			}
			
			<LoginArrangement isRegistering={isToggled} user={User} password={Pw} licenseKey={Key}/>
			&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
			<button className="commonButton" onClick={()=>setIsToggled(!isToggled)}>{registerNback}</button>
			
			</div>
		
	);
}