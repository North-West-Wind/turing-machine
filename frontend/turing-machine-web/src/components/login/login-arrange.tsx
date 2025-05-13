import { useNavigate } from "react-router-dom";
import { login, register, startAutoValidate } from "../../helpers/network.ts";
import { getLevel, getMachine, PersistenceKey, save } from "../../helpers/persistence.ts";

interface Props {
	isRegistering: boolean;
	user: string;
	password: string;
	licenseKey: string;
}

export default function LoginArrangement({ isRegistering, user, password, licenseKey }: Props) {
	const navigate = useNavigate();

	const tryLogin = async (username: string, password: string) => {
		try {
			const accessToken = await login(username, password);
			save(PersistenceKey.AUTH, JSON.stringify({ username, accessToken }), false);
			startAutoValidate();
			if (getLevel() || getMachine()) navigate("/designer");
			else navigate("/mode");
		} catch (err) {
			console.error(err);
		}
	}
	const tryRegister = async (username: string, password: string, licenseKey: string) => {
		try {
			const accessToken = await register(username, password, licenseKey);
			save(PersistenceKey.AUTH, JSON.stringify({ username, accessToken }), false);
			startAutoValidate();
			if (getLevel() || getMachine()) navigate("/designer");
			else navigate("/mode");
		} catch (err) {
			console.error(err);
		}
	}

	// ? true : false`
	return (
		<>
			{
				isRegistering ?
					<button className="commonButton" onClick={() => tryRegister(user, password, licenseKey)}>Submit</button>
					:
					<button className="commonButton" onClick={() => tryLogin(user, password)}>Sign</button>
			}
		</>
	);

}