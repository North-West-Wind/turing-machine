import { Level } from "./designer/level";
import { SaveableTuringMachine } from "./designer/machine";
import { Auth } from "./network";

export enum PersistenceKey {
	LEVEL = "tm:level",
	LEVEL_MACHINE = "tm:level_machine",
	MACHINE = "tm:machine",
	TIME = "tm:save_time",
	AUTH = "tm:auth",
	RANK = "tm:rank"
}

// A wrapper of localStorage.setItem to store timestamp as well
export function save(key: PersistenceKey, value?: string, save = true) {
	if (value === undefined) window.localStorage.removeItem(key);
	else window.localStorage.setItem(key, value);
	if (save) window.localStorage.setItem(PersistenceKey.TIME, Date.now().toString());
}

function get<T>(key: PersistenceKey) {
	const value = window.localStorage.getItem(key);
	if (!value) return undefined;
	try {
		return JSON.parse(value) as T;
	} catch (err) {
		console.error(err);
		return undefined;
	}
}

export function getLevel() {
	return get<Level>(PersistenceKey.LEVEL);
}

export function getLevelMachine() {
	return get<SaveableTuringMachine>(PersistenceKey.LEVEL_MACHINE);
}

export function getMachine() {
	return get<SaveableTuringMachine>(PersistenceKey.MACHINE);
}

export function getAuth() {
	return get<Auth>(PersistenceKey.AUTH);
}

export function getRanks() {
	return get<Record<string, number>>(PersistenceKey.RANK);
}

export function invalidateAuth() {
	save(PersistenceKey.AUTH, undefined, false);
}

export function getSaveTime() {
	const value = window.localStorage.getItem(PersistenceKey.TIME);
	if (!value) return 0;
	return parseInt(value);
}