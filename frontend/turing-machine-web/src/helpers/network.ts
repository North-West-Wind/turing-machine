import { DetailedLevel, SimpleLevel } from "./designer/level";
import { SaveableTuringMachine } from "./designer/machine";
import { getAuth, getLevel as getPersistentLevel } from "./persistence";
import JSEncrypt from "jsencrypt";

// testing without server
// in production, keep the /api part only
const BASE_URL = "http://localhost:3100/api";

type ServerResponse<S extends boolean, T> = {
	success: S;
	errcode: S extends false ? string : undefined;
	errmsg: S extends false ? string : undefined;
	data: S extends true ? T : undefined;
}

type UndeterminedServerResponse<T> = ServerResponse<boolean, T>;

export type Auth = {
	username: string;
	accessToken: string;
}

export type CloudSaveResult = {
	error: boolean;
	message?: string;
}

const encrypt = new JSEncrypt();

async function authFetch(url: string, method: "GET" | "POST" = "GET", data?: any) {
	const auth = getAuth();
	if (!auth) throw new Error("Not authorized");
	const res = await fetch(BASE_URL + "/pubkey");
	const json = await res.json();
	if (!json.success) throw new Error("Unsuccessful server response");
	encrypt.setPublicKey(json.data.key);
	const headers: HeadersInit = {
		Authorization: `Bearer ${encrypt.encrypt(auth.accessToken)}`,
	};
	if (data) headers["Content-Type"] = "application/json";
	return await fetch(BASE_URL + url, {
		method,
		headers,
		body: data ? JSON.stringify(data) : undefined
	});
}

export async function saveToCloud(saveable: SaveableTuringMachine): Promise<CloudSaveResult> {
	const level = getPersistentLevel();
	const res = await authFetch("/save", "POST", { level: level ? level.id : null, machine: saveable });
	if (!res.ok) return { error: true, message: "Received HTTP status: " + res.status };
	const json = await res.json() as UndeterminedServerResponse<undefined>;
	if (!json.success) return { error: true, message: `${json.errcode}: ${json.errmsg}` };
	return { error: false };
}

export async function getLevels() {
	const res = await authFetch("/levels");
	const json = await res.json() as { success: boolean, data: SimpleLevel[] };
	if (!json.success) throw new Error("Unsuccessful server response");
	return json.data;
}

export async function getLevel(levelId: string) {
	const res = await authFetch("/level/" + levelId);
	const json = await res.json() as { success: boolean, data: DetailedLevel };
	if (!json.success) throw new Error("Unsuccessful server response");
	return json.data;
}

export async function upload(machine: SaveableTuringMachine) {
	const res = await authFetch("/upload", "POST", { machine });
	const json = await res.json() as { success: boolean, data: { id: number } };
	if (!json.success) throw new Error("Unsuccessful server response");
	return json.data.id;
}

export async function download(id: string) {
	const res = await authFetch("/import/" + id);
	const json = await res.json() as { success: boolean, data: { machine: SaveableTuringMachine } };
	if (!json.success) throw new Error("Unsuccessful server response");
	return json.data.machine;
}