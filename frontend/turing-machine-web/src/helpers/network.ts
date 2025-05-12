import { DetailedLevel, SimpleLevel } from "./designer/level";
import { SaveableTuringMachine } from "./designer/machine";
import { getAuth, getLevel as getPersistentLevel } from "./persistence";
import JSEncrypt from "jsencrypt";
import { DateTime } from "luxon";

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
	message?: UnsuccessfulServerResponse["status"];
}

export type CloudProgress = {
	level?: number;
	machineDesign: SaveableTuringMachine;
	time: number;
	isSolved: boolean;
}

const encrypt = new JSEncrypt();

async function encryptWithPubkey(data: string) {
	// Get public key for encrypting auth
	let res = await fetch(BASE_URL + "/get-rsa-key");
	if (!res.ok) throw new Error("Received HTTP status: " + res.status);
	const json = await res.json() as ServerResponse<string>;
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");

	// Do the encryption
	encrypt.setPublicKey(json.result);
	const encrypted = encrypt.encrypt(data);
	if (!encrypted) throw new Error("Encryption failed");
	return encrypted;
}

async function authFetch<T>(url: string, queries: Record<string, string | number> = {}, method: "GET" | "POST" = "GET", data?: any) {
	// Check if we have authorization info
	const auth = getAuth();
	if (!auth) throw new Error("Not authorized");

	// Encrypt the access token
	//const accessToken = await encryptWithPubkey(auth.accessToken);
	//queries["accessToken"] = accessToken;
	queries["accessToken"] = auth.accessToken;

	return await normFetch<T>(url, queries, method, data);
}

async function normFetch<T>(url: string, queries: Record<string, string | number> = {}, method: "GET" | "POST" = "GET", data?: any) {
	// Prepare header and queries
	const headers: HeadersInit = { Accept: "application/json" };
	if (data) headers["Content-Type"] = "application/json";
	const urlQueries: string[] = [];
	for (const [key, value] of Object.entries(queries))
		urlQueries.push(`${key}=${encodeURIComponent(value)}`);

	// Make the request
	const res = await fetch(BASE_URL + url + `?${urlQueries.join("&")}`, {
		method,
		headers,
		body: data ? JSON.stringify(data) : undefined
	});
	if (!res.ok) throw new Error("Received HTTP status: " + res.status);
	return await res.json() as ServerResponse<T>;
}

export async function saveToCloud(saveable: SaveableTuringMachine): Promise<CloudSaveResult> {
	const level = getPersistentLevel();
	const queries: Record<string, string | number> = {};
	if (level) queries.levelID = level.levelID;
	else queries.levelID = 255;
	const json = await authFetch("/save", queries, "POST", saveable);
	if (json.status != "SUCCESS") return { error: true, message: json.status };
	return { error: false };
}

export async function getLevels() {
	const json = await authFetch<SimpleLevel[]>("/levels");
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result.map(level => {
		const wrong = level as SimpleLevel & { parent: string };
		if (!wrong.parent) level.parent = undefined;
		else level.parent = atob(wrong.parent).charCodeAt(0);
		return level;
	});
}

export async function getLevel(levelID: string | number) {
	const json = await authFetch<DetailedLevel>("/level", { levelID });
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result;
}

export async function getSandboxMachine() {
	try {
		const level = await getLevel(255);
		return level.design;
	} catch (err) {
		return undefined;
	}
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

export async function submitMachine(machine: SaveableTuringMachine, operations: number, levelID: number) {
	// This returns a percentage [0, 1]
	const json = await authFetch<number>("/level", { levelID, operations }, "POST", machine);
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result;
}

export async function getLevelStat(levelID: number) {
	const json = await authFetch<number | null>("/stat", { levelID });
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result;
}

const encoder = new TextEncoder();

async function sha256(data: string) {
	const buf = await window.crypto.subtle.digest("SHA-256", encoder.encode(data));
	const arr = Array.from(new Uint8Array(buf));
	return arr.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function login(username: string, password: string) {
	// Hash password
	const hash = await sha256(password); // Source password
	const twice = await sha256(hash); // DB password
	const saltArray = new Uint8Array(24);
	window.crypto.getRandomValues(saltArray);

	const salt = Array.from(saltArray).map(byte => byte.toString(16).padStart(2, "0")).join("");
	const hashedPassword = await sha256(twice + salt); // Server computes hash( db + salt )

	// Make login request
	const json = await normFetch<{ accessToken: string }>("/login", { username, hashedPassword, salt }, "POST");
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result.accessToken;
}

export async function register(username: string, password: string, licenseKey: string) {
	// Encrypt password
	const hash = await sha256(password); // Source password. DB stores hash of this
	const rsaEncryptedPassword = await encryptWithPubkey(hash);

	// Make register request
	const json = await normFetch<string>("/register", { username, rsaEncryptedPassword, licenseKey }, "POST");
	if (json.status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.result;
}

export async function validateAccessToken() {
	const json = await authFetch("/validate");
	return json.status == "SUCCESS";
}

export async function getProgress() {
	const json = await authFetch<CloudProgress & { time: string }>("/progress");
	if (json.status != "SUCCESS") return undefined;
	// Get timezone from server time, set timezone for save time
	(json.result as CloudProgress).time = DateTime.fromISO(json.result.time).setZone(DateTime.fromISO(json.time).zone).toMillis();
	if (json.result.level == 255) json.result.level = undefined;
	return json.result as CloudProgress;
}

export function startAutoValidate() {
	setTimeout(() => {
		validateAccessToken().catch(console.error);
		startAutoValidate();
	}, 20 * 60 * 1000); // validate every 20 minutes
}