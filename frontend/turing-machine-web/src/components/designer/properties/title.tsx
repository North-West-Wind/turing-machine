export default function DesignerPropertiesTitle(props: { id: number, prefix: string }) {
	return <div className="designer-properties-title">{props.prefix} {props.id}</div>;
}