import { useEffect, useRef, useState } from "react";

function clamp(val: number, min: number, max: number) {
	return Math.max(min, Math.min(max, val));
}

// global sliding state so useEffect can read

export default function DesignerSimulationSlider(props: { fraction: number, onChange: (fraction: number) => void }) {
	const [fraction, setFraction] = useState(clamp(props.fraction, 0, 1));
	const div = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setFraction(clamp(props.fraction, 0, 1));
	}, [props.fraction]);

	const onMouseDown = () => {
		const onMouseMove = (ev: MouseEvent) => {
			if (!div.current) return;
			const pos = ev.clientX - div.current.clientLeft;
			const frac = clamp(pos / div.current.clientWidth, 0, 1);
			setFraction(frac);
			props.onChange(frac);
		};

		const onMouseUp = () => {
			window.removeEventListener("mousemove", onMouseMove);
		}

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp, { once: true });
	};

	return <div
		className="designer-simulation-slider"
		onMouseDown={onMouseDown}
		ref={div}
	>
		<div className="slideable" style={{ width: (fraction * 100) + "%" }}></div>
		<div className="filler" style={{ width: ((1 - fraction) * 100) + "%" }}></div>
	</div>
}