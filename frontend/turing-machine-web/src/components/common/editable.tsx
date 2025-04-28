import React, { useEffect, useRef, useState } from "react"
import "../../styles/common.css";

export default function EditableBox(props: { className?: string, value: string, onCommit: (value: string) => void }) {
	const ref = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState(props.value);
	const [edit, setEdit] = useState(false);

	useEffect(() => {
		setValue(props.value);
	}, [props.value]);

	const onKeyDown = (ev: React.KeyboardEvent) => {
		if (ev.key == "Enter") {
			props.onCommit(value);
			setEdit(false);
			ref.current?.blur();
		} else if (ev.key == "Escape") {
			setEdit(false);
			setValue(props.value);
		}
	};

	const onMouseDown = (ev: React.MouseEvent) => {
		if (ev.button == 0) setEdit(true);
	};

	return <input
		className={`editable-box ${edit ? "" : "stable"} ${props.className || ""}`}
		value={value}
		onChange={ev => setValue(ev.currentTarget.value)}
		onKeyDown={onKeyDown}
		onMouseDown={onMouseDown}
		onBlur={() => setEdit(false)}
	/>;
}