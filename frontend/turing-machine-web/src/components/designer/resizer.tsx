import React, { useEffect, useState } from "react";

export default function DesignerResizer(props: { vertical?: boolean, onChangeProportion: (change: number) => void, onSettle: (change: number) => void }) {
	const [pressed, setPressed] = useState(false);
	const [pos, setPos] = useState([0, 0]);

	useEffect(() => {
		const onMouseMove = (ev: MouseEvent) => {
			if (props.vertical) props.onChangeProportion((ev.clientX - pos[0]) / window.innerWidth);
			else props.onChangeProportion((ev.clientY - pos[1]) / window.innerHeight);
		};

		if (pressed) {
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", (ev) => {
				setPressed(false);
				props.onSettle(props.vertical ? (ev.clientX - pos[0]) / window.innerWidth : (ev.clientY - pos[1]) / window.innerHeight);
			}, { once: true });
			return () => window.removeEventListener("mousemove", onMouseMove);
		}
	}, [pressed]);

	const onMouseDown = (ev: React.MouseEvent) => {
		setPressed(true);
		setPos([ev.clientX, ev.clientY]);
	};

	return <div
		className={`designer-resizer ${props.vertical ? "vert" : "hori"}`}
		onMouseDown={onMouseDown}
	></div>;
}