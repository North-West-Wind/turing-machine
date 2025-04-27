export default function DesignerSimulationButton(props: { src: string, text?: string, onClick: () => void }) {
	return <div className="designer-simulation-button" onClick={props.onClick}>
		<img src={props.src} />
		{props.text ? props.text : <></>}
	</div>;
}