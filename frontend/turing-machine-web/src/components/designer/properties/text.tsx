import { useEffect, useState } from "react";
import EditableBox from "../../common/editable";

export default function DesignerPropertiesText(props: { prefix: string, value: string, onCommit: (value: string) => boolean }) {
	const [value, setValue] = useState(props.value);
	const [reset, setReset] = useState(false); // used for resetting box

	useEffect(() => {
		setValue(props.value);
	}, [props.value]);

	const onCommit = (value: string) => {
		if (props.onCommit(value))
			setValue(value);
		else
			setReset(!reset);
	};

	return <div className="designer-properties-section">
		<div className="designer-properties-label">
			{props.prefix}:
			<EditableBox value={value} onCommit={onCommit} key={reset ? 1 : 0} />
		</div>
	</div>;
}