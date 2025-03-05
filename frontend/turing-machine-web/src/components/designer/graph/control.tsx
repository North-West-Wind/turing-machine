import DesignerGraphButton from "./button";

export default function DesignerGraphControl(props: { text: boolean, rect: boolean, onText: () => void, onRect: () => void }) {
	return <div className="designer-graph-control">
		<DesignerGraphButton className={props.text ? "active" : ""} src="graph/text.svg" onClick={props.onText} />
		<DesignerGraphButton className={props.rect ? "active" : ""} src="graph/rect.svg" onClick={props.onRect} />
	</div>;
}