import ConsoleCommand from "./base";

export default class InfoCommand extends ConsoleCommand {
	constructor() {
		super("info", "Displays information about special symbols that can be used for transitions.");
	}

	handle() {
		return [
			"Special symbols for transitions:",
			"_  - Blank",
			"/  - Do not perform read/write",
			"\\p - Write a pause state to a cell",
			"\\r - Write a resume state to a cell"
		]
	}
}