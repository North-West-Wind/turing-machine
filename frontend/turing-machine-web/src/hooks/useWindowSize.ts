import { useEffect, useState } from "react";

export default function useWindowSize() {
	const [x, setX] = useState(window.innerWidth);
	const [y, setY] = useState(window.innerHeight);

	useEffect(() => {
		const onresize = () => {
			setX(window.innerWidth);
			setY(window.innerHeight);
		};

		window.addEventListener("resize", onresize);
		return () => window.removeEventListener("resize", onresize);
	}, []);

	return { x, y };
}