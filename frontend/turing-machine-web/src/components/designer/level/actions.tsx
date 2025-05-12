import { useNavigate } from "react-router-dom";
import simulator from "../../../helpers/designer/simulator";
import { createMachine, getMachine, includeDesign } from "../../../helpers/network";
import Loading from "../../common/loading";
import { useState } from "react";
import { PersistenceKey, save } from "../../../helpers/persistence";

export default function DesignerLevelActions() {
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const navigate = useNavigate();

	const selectLevel = () => {
		// auto-save just in case
		setLoading(true);
		navigate("/level");
	};

	const uploadMachine = async () => {
		setLoading(true);
		try {
			const id = await createMachine(simulator.save());
			await includeDesign(id);
			setMessage(`Uploaded! Your machine's ID: ${id}`);
		} catch (err) {
			console.error(err);
			setMessage("Error!");
		}
		setLoading(false);
	};

	const importMachine = async () => {
		if (!confirm("This will override your local machine. Are you sure?")) return;
		const id = prompt("Please input the machine's ID:");
		if (!id) return;
		setLoading(true);
		try {
			// There are too many components to reload with a localstorage change
			// So reloading is a better choice
			const machine = await getMachine(id);
			save(PersistenceKey.MACHINE, JSON.stringify(machine));
			setMessage(`Imported! This page will reload in 3 seconds.`);
		} catch (err) {
			console.error(err);
			setMessage("Error!");
		}
		setTimeout(() => window.location.reload(), 3000);
		setLoading(false);
	};

	return <>
		<div className="designer-level-actions-message">{message}</div>
		<div className="designer-level-actions">
			<div className="designer-level-button play" onClick={selectLevel}>Select a level</div>
			<div className="designer-level-button upload" onClick={uploadMachine}>Share this machine</div>
			<div className="designer-level-button import" onClick={importMachine}>Import a machine</div>
			<Loading enabled={loading} />
		</div>
	</>;
}