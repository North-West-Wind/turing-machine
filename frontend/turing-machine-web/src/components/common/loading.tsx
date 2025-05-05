import "../../styles/common.css";

export default function Loading(props: { enabled: boolean }) {
	return <div className={"loading" + (props.enabled ? "" : " display-none")}>
		<div>
			<img src="/ui/loading.svg" />
		</div>
	</div>;
}