import {useNavigate} from "react-router-dom";
import {Auth} from "../../helpers/network.ts";

interface Props{
	isRegistering: boolean;
	user : string;
	password : string ;
	licenseKey : string;
}

export default function LoginArrangement({isRegistering, user, password, licenseKey}:Props){
	const navigate = useNavigate();

	function verify_Login(user:string, password:string){
		//let submitUser : User;
		let submitUser = {id: user, password: password}

		fetch('http://localhost:8000/login', {
			method: 'POST',
			headers: {'Content-Type' : 'application/json'},
			body : JSON.stringify(submitUser)
		})
		.then(res => {
			return res.json()
		})
		.then(()=> {
			// GET the pubkey
			fetch('http://localhost:8000/pubkey') // When using server, the end point will be differrent
			.then(res => {
				return res.json()
			})
			.then((response: { success: boolean; data: { accessToken: string } })=> {

				if(response.success){
					console.log("Success")

					const auth: Auth = {
						username: user, 
						accessToken: response.data.accessToken
					};

					window.localStorage.setItem('tm:auth', JSON.stringify(auth));
					navigate("/mode")
				}
				else{
					alert("Login failed, please retry");
				return;
				}

				
			})
		})		

	}
	function verify_License(user:string, password:string, licenseKey:string) {
		let regLicense = {id: user, password: password, licenseKey: licenseKey}

		fetch('http://localhost:8000/register', {
			method: 'POST',
			headers: {'Content-Type' : 'application/json'},
			body : JSON.stringify(regLicense)
		})
		.then(res => {
			return res.json()
		})
		.then(()=>{
			console.log("Registered success")
		})
	}

	// ? true : false`
	return (
		<>
		{
		isRegistering ? 
		<button className="commonButton" onClick={function(){verify_License(user, password, licenseKey)}}>Submit</button> 
		:
		<button className="commonButton" onClick={function(){verify_Login(user, password)}}>Sign</button> 
		}
		</>
	);

}