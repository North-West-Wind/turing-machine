import {useNavigate} from "react-router-dom";

interface Props{
	isRegistering: boolean;
	user : string;
	password : string ;
	licenseKey : string;
}

export default function LoginArrangement({isRegistering, user, password, licenseKey}:Props){
	const navigate = useNavigate();

	function verify_Login(user:string, password:string){
		if(user=="1" && password == "1"){
			navigate("/mode")
		}
		else
			return alert("Incorrect input")
	}

	function verify_License(licenseKey:string) {
		if(licenseKey == "2")
			return alert("register success!")

	}

	// ? true : false`
	return (
		<>
		{
		isRegistering ? 
		<button onClick={function(){verify_License(licenseKey)}}>Start Register</button> 
		:
		<button onClick={function(){verify_Login(user, password)}}>Login</button> 
		}
		</>
	);

}