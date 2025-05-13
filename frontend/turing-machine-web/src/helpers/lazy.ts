import { DetailedLevel, SimpleLevel } from "./designer/level";
import { getLevels } from "./network";

class LazyLoader<T> {
	private getter: () => T | Promise<T>;
	private stored?: T;

	constructor(getter: () => T | Promise<T>) {
		this.getter = getter;
	}

	async get() {
		if (this.stored !== undefined) return this.stored;
		return this.stored = await this.getter();
	}
}

const lazyLevels = new LazyLoader<SimpleLevel[]>(getLevels);
const levelCache = new Map<number, DetailedLevel>();

function cacheLevel(idOrLevel: number | DetailedLevel) {
	if (typeof idOrLevel != "number") {
		levelCache.set(idOrLevel.levelID, idOrLevel);
		return idOrLevel;
	} else return levelCache.get(idOrLevel);
}

function invalidateCachedLevel(id: number) {
	levelCache.delete(id);
}

export { cacheLevel, invalidateCachedLevel as invalidateLevel, lazyLevels };