export default function DesignerSimulationButton(props: { src: string, onClick: () => void }) {
	return <div className="designer-simulation-button" onClick={props.onClick}>
		<img src={props.src} />
	</div>;
}