import ConsoleCommand from "./base";

export default class HelpCommand extends ConsoleCommand {
	constructor() {
		super("help");
	}

	handle(_args: string[], commands: ConsoleCommand[]): string[] {
		return commands.map(command => "/" + command.id);
	}
}