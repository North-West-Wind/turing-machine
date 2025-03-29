import {useNavigate} from "react-router-dom";

interface Props{
	isRegistering: boolean;
	user : string;
	password : string ;
	licenseKey : string;
}

interface User {
	id: number;
	name: string;

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


/*
	function verify_License(licenseKey:string) {
		fetch('http://localhost:8000/users')
			.then(res => {
				return res.json()
			})
			.then((data)=> {
				
				let license:User[] 
				license = data.users;
				
				console.log(license[0].id) 
				//console.log(data)
				
			})
	
	}
*/



	// ? true : false`
	return (
		<>
		{
		isRegistering ? 
		<button className="commonButton" onClick={function(){verify_License(licenseKey)}}>Submit</button> 
		:
		<button className="commonButton" onClick={function(){verify_Login(user, password)}}>Sign</button> 
		}
		</>
	);

}