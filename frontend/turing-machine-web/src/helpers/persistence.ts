import { DetailedLevel } from "./designer/level";
import { SaveableTuringMachine } from "./designer/machine";
import { Auth } from "./network";

export enum PersistenceKey {
	LEVEL = "tm:level",
	MACHINE = "tm:machine",
	TIME = "tm:save_time",
	AUTH = "tm:auth",
}

// A wrapper of localStorage.setItem to store timestamp as well
export function save(key: PersistenceKey, value?: string) {
	if (value === undefined) window.localStorage.removeItem(key);
	else window.localStorage.setItem(key, value);
	window.localStorage.setItem(PersistenceKey.TIME, Date.now().toString());
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
	return get<DetailedLevel>(PersistenceKey.LEVEL);
}

export function getMachine() {
	return get<SaveableTuringMachine>(PersistenceKey.MACHINE);
}

export function getAuth() {
	return get<Auth>(PersistenceKey.AUTH);
}