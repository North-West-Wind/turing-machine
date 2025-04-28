import { ChangeEvent, useEffect, useState } from "react"

export default function DesignerPropertiesCheckbox(props: { prefix: string, value: boolean, onChange: (value: boolean) => boolean | void }) {
	const [value, setValue] = useState(props.value);

	useEffect(() => {
		setValue(props.value);
	}, [props.value]);

	const onChange = (ev: ChangeEvent<HTMLInputElement>) => {
		const result = props.onChange(ev.currentTarget.checked);
		if (result === undefined || result) setValue(ev.currentTarget.checked);
	}

	return <div className="designer-properties-section">
		<div className="designer-properties-checkbox">
			{props.prefix}
			<input type="checkbox" checked={value} onChange={onChange} />
		</div>
	</div>
}