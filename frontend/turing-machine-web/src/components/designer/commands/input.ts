import ConsoleCommand from "./base";

export default class InputCommand extends ConsoleCommand {
	constructor() {
		super("input");
	}

	handle(args: string[]): string[] {
		if (!args.length) return [`Missing argument. Either a number or "reset" is required`];
		if (args[0] == "reset") {
			ConsoleCommand.modifyingTape = -1;
			return ["Reset inputting tape"];
		}
		const parsed = parseInt(args[0]);
		if (isNaN(parsed)) return [`Argument is not a number and not "reset"`];
		ConsoleCommand.modifyingTape = parsed;
		return ["Set inputting tape to " + parsed];
	}
}