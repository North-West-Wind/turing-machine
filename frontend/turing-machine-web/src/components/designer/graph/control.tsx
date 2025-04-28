import DesignerGraphButton from "./button";

export default function DesignerGraphControl(props: { buttons: { [key: string]: boolean }, on: (key: string) => void,  }) {
	return <div className="designer-graph-control">
		{Array.from(Object.keys(props.buttons)).map(key =>
			<DesignerGraphButton
				key={key}
				className={props.buttons[key] ? "active" : ""}
				src={`graph/${key}.svg`}
				onClick={() => props.on(key)} />)}
	</div>;
}