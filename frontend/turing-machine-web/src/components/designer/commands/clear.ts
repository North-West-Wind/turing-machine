import simulator from "../../../helpers/designer/simulator";
import ConsoleCommand from "./base";

export default class ClearCommand extends ConsoleCommand {
	constructor() {
		super("clear");
	}

	handle(args: string[]): string[] {
		const ids = args.map(arg => parseInt(arg)).filter(id => !isNaN(id));
		if (ids.length) return ids.map(id => simulator.setTapeContent("", id) ? "Cleared tape " + id : "Failed to clear tape " + id);
		simulator.setInput("");
		return ["Cleared tape " + simulator.getInputTape() + " (input)"];
	}
}