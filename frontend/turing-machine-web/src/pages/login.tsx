import Login_box from '../components/login/login-box'
import LoginArrangement from '../components/login/login-arrange';
import {useState} from 'react';
import '../app.css'

export default function LoginPage() {
	// This one is driven by button
	const [isToggled, setIsToggled] = useState<boolean>(false);
	let registerNback = isToggled ? "Back" : "Register";
	
	// Three const are interrupt driven variable by input box
	const [User, saveUser] = useState<string>('');
	const [Pw, savePw] = useState<string>('');
	const [Key, saveKey] = useState<string>('');
	// Updater functions for the three once triggered interrupt
	function UserChange(value:string){saveUser(value);}
	function PwChange(value: string){savePw(value);}
	function KeyChange(value: string){saveKey(value);}
	
	return (
		<div>
			<h2>Username</h2>
			<Login_box BoxChange={UserChange} />
			<br/>
	
			<h2>Password</h2>
			<Login_box BoxChange={PwChange}/>
			<br/>
			
			{
				isToggled ?
				<div>
					<h2>License Key</h2>
					<Login_box BoxChange={KeyChange}/>
				</div>
				:
				<></> 
			}
	
			<LoginArrangement isRegistering={isToggled} user={User} password={Pw} licenseKey={Key}/>
			<button onClick={()=>setIsToggled(!isToggled)}>{registerNback}</button>
	
		</div>
	);
}