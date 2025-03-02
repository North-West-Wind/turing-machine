import Login_box from '../../components/box'
import Button_box from '../../components/login_button';
import {useState} from 'react';
import '../app.css'

// Correct, yes. Else no
export default function LoginPage() {
	const [User, saveUser] = useState<string>('');
	const [Pw, savePw] = useState<string>('');

	function UserChange(value:string){
		saveUser(value);
	}

	function PwChange(value: string){
		savePw(value);
	}

	return (
		<div>
			<h2>Username</h2>
			<Login_box BoxChange={UserChange} />
			
			<br></br>

			<h2>Password</h2>
			<Login_box BoxChange={PwChange}/>
			

			<p className="login">
				<Button_box user={User} password={Pw} ></Button_box>
			</p>

		</div>
	);
}