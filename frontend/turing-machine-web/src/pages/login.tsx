import { useLocation } from "react-router-dom";

export default function LoginPage() {
	const location = useLocation();
	return <div>TODO: login ({location.pathname})</div>;
}