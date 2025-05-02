export default abstract class ConsoleCommand {
	// shared data between commands
	static modifyingTape = -1;

	readonly id: string;
	readonly description: string;
	readonly usage: string;

	constructor(id: string, description: string, usage?: string) {
		this.id = id;
		this.description = description;
		this.usage = usage || "";
	}

	abstract handle(args: string[], commands: ConsoleCommand[]): string[];
	
	addToMap(map: Map<string, ConsoleCommand>) {
		map.set(this.id, this);
	}
}