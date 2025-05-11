import { DetailedLevel, SimpleLevel } from "./designer/level";
import { SaveableTuringMachine } from "./designer/machine";
import { isEmpty } from "./objects";
import { getAuth, getLevel as getPersistentLevel } from "./persistence";
import JSEncrypt from "jsencrypt";

// testing without server
// in production, keep the /api part only
const BASE_URL = "/api";

type UnsuccessfulServerResponse = {
	time: string;
	status: "TOKEN_EXPIRED"
				| "INVALID_TOKEN"
				| "INVALID_USERNAME_OR_PASSWORD"
				| "INVALID_PASSWORD"
				| "NO_SUCH_ITEM"
				| "USER_NOT_FOUND"
				| "DESIGN_NOT_FOUND"
				| "TOO_MANY_REQUEST"
				| "BACKEND_ERROR"
				| "USER_EXISTED"
				| "INVALID_LICENSE"
				| "DUPLICATED_USER"
				| "DUPLICATED_DESIGN"
				| "DUPLICATED_ITEM";
	responseStackTraces: string;
}

type SuccessfulServerResponse<T> = {
	time: string;
	status: "SUCCESS";
	result: T;
}

type ServerResponse<T> = UnsuccessfulServerResponse | SuccessfulServerResponse<T>;

export type Auth = {
	username: string;
	accessToken: string;
}

export type CloudSaveResult = {
	error: boolean;
	message?: string;
}

const encrypt = new JSEncrypt();

async function authFetch<T>(url: string, queries: Record<string, string | number> = {}, method: "GET" | "POST" = "GET", data?: any) {
	// Check if we have authorization info
	const auth = getAuth();
	if (!auth) throw new Error("Not authorized");

	// Get public key for encrypting auth
	let res = await fetch(BASE_URL + "/get-rsa-key");
	if (!res.ok) throw new Error("Received HTTP status: " + res.status);
	const json = await res.json() as ServerResponse<string>;
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");

	// Do the encryption
	encrypt.setPublicKey(json.result);
	const accessToken = encrypt.encrypt(auth.accessToken);
	if (!accessToken) throw new Error("Encryption failed");

	// Prepare header and queries
	const headers: HeadersInit = {};
	if (data) headers["Content-Type"] = "application/json";
	queries["accessToken"] = accessToken;
	const urlQueries: string[] = [];
	for (const [key, value] of Object.entries(queries))
		urlQueries.push(`${key}=${value}`);

	// Make the request
	res = await fetch(BASE_URL + url + `?${urlQueries.join("&")}`, {
		method,
		headers,
		body: data ? JSON.stringify(data) : undefined
	});
	if (!res.ok) throw new Error("Received HTTP status: " + res.status);
	return await res.json() as ServerResponse<T>;
}

export async function saveToCloud(saveable: SaveableTuringMachine): Promise<CloudSaveResult> {
	const level = getPersistentLevel();
	const json = await authFetch("/save", {  }, "POST", { level: level ? level.id : null, machine: saveable });
	if (json.status != "SUCCESS") return { error: true, message: json.responseStackTraces };
	return { error: false };
}

export async function getLevels() {
	const json = await authFetch<SimpleLevel[]>("/levels");
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result;
}

export async function getLevel(levelID: string) {
	const json = await authFetch<DetailedLevel>("/level", { levelID });
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result;
}

export async function upload(machine: SaveableTuringMachine) {
	const json = await authFetch<string>("/upload", {}, "POST", machine);
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result;
}

export async function download(id: string) {
	const json = await authFetch<SaveableTuringMachine>("/import", { designID: id });
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result;
}

export async function submitMachine(machine: SaveableTuringMachine, operations: number, levelID: string) {
	const tapes = machine.tapes.length;
	let heads = 0, transitions = 0, nodes = 0;
	machine.machines.forEach(machine => {
		heads += machine.heads.length;
		transitions += machine.transitions.length;
		nodes += machine.label.nodes.filter(node => !isEmpty(node)).length;
	});
	// This returns a percentage [0, 1]
	const json = await authFetch<number>("/level", { levelID, tapes, heads, transitions, nodes, operations }, "POST", machine);
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result;
}

export async function getLevelStat(levelID: string) {
	const json = await authFetch<number | null>("/stat", { levelID });
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result;
}