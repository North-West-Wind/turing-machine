import ConsoleCommand from "./base";

export default class HelpCommand extends ConsoleCommand {
	constructor() {
		super("help", "Displays this message.");
	}

	handle(args: string[], commands: ConsoleCommand[]): string[] {
		const command = args.length > 0 ? commands.find(cmd => cmd.id == args[0]) : undefined;
		if (!command) return commands.sort((a, b) => a.id.localeCompare(b.id)).map(command => `/${command.id} - ${command.description}`);
		return [
			`/${command.id} ${command.usage}`,
			command.description
		];
	}
}