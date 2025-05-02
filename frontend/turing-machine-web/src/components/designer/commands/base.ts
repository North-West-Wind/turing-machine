export default abstract class ConsoleCommand {
	// shared data between commands
	static modifyingTape = -1;

	id: string;

	constructor(id: string) {
		this.id = id;
	}

	abstract handle(args: string[], commands: ConsoleCommand[]): string[];
	
	addToMap(map: Map<string, ConsoleCommand>) {
		map.set(this.id, this);
	}
}