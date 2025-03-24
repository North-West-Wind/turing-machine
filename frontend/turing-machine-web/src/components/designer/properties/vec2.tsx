import { useState } from "react";
import { Vec2 } from "../../../helpers/designer/math";
import EditableBox from "../../common/editable";

export default function DesignerPropertiesVec2(props: { vec: Vec2, prefix: string, onCommit: (vec: Vec2) => boolean }) {
	const [collapsed, setCollapsed] = useState(false);
	const [vec, setVec] = useState(props.vec);
	const [reset, setReset] = useState(false);

	const onCommit = (isX: boolean) => (value: string) => {
		const parsed = Number(value);
		if (isNaN(parsed)) {
			setReset(!reset);
			return;
		}
		const newVec = new Vec2(isX ? Number(value) : vec.x, isX ? vec.y : Number(value));
		if (props.onCommit(newVec)) setVec(newVec);
		else {
			setReset(!reset);
		}
	};

	return <div className="designer-properties-section">
		{collapsed && <div className="designer-properties-vec2 header" onClick={() => setCollapsed(false)}>
			▶ {props.prefix}: {vec.x.toFixed(2)}, {vec.y.toFixed(2)}
		</div>}
		{!collapsed && <>
			<div className="designer-properties-vec2 header" onClick={() => setCollapsed(true)}>▼ {props.prefix}</div>
			<div className="designer-properties-vec2">
				x: <EditableBox value={vec.x.toFixed(4)} onCommit={onCommit(true)} key={reset ? 1 : 0} />
			</div>
			<div className="designer-properties-vec2">
				y: <EditableBox value={vec.y.toFixed(4)} onCommit={onCommit(false)} key={reset ? 0 : 1} />
			</div>
		</>}
	</div>;
}