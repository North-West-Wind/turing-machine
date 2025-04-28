export default function DesignerGraphButton(props: { className?: string, src: string, onClick: () => void }) {
	return <div className={"designer-graph-button " + (props.className || "")} onClick={props.onClick}>
		<img src={props.src} />
	</div>;
}