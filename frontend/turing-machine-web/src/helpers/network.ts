import { Level } from "./designer/level";
import { SaveableTuringMachine } from "./designer/machine";
import { getAuth } from "./persistence";
import JSEncrypt from "jsencrypt";
import { DateTime } from "luxon";

// testing without server
// in production, keep the /api part only
const BASE_URL = "/API";

type UnsuccessfulServerResponse = {
	ResponseTime: string;
	Status: "TOKEN_EXPIRED"
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
	ResponseTrace: string;
}

type SuccessfulServerResponse<T> = {
	ResponseTime: string;
	Status: "SUCCESS";
	Result: T;
}

type ServerResponse<T> = UnsuccessfulServerResponse | SuccessfulServerResponse<T>;

export type Auth = {
	username: string;
	accessToken: string;
}

export type CloudSaveResult = {
	error: boolean;
	message?: UnsuccessfulServerResponse["Status"];
}

export type CloudProgress = {
	LevelID: number;
	DesignID: string;
	SubmittedTime: number;
	IsSolved: boolean;
}

// Aliasing
type DesignID = string;

const encrypt = new JSEncrypt();

async function encryptWithPubkey(data: string) {
	// Get public key for encrypting auth
	let res = await fetch(BASE_URL + "/GetPublicKey");
	if (!res.ok) throw new Error("Received HTTP status: " + res.status);
	const json = await res.json() as ServerResponse<string>;
	if (json.Status != "SUCCESS") throw new Error("Unsuccessful server response");

	// Do the encryption
	encrypt.setPublicKey(json.Result);
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

// User
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
	const json = await normFetch<string>("/login", { username, hashedPassword, salt }, "POST");
	if (json.Status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.Result;
}

export async function register(username: string, password: string, licenseKey: string) {
	// Encrypt password
	const hash = await sha256(password); // Source password. DB stores hash of this
	const rsaEncryptedPassword = await encryptWithPubkey(hash);

	// Make register request
	const json = await normFetch<string>("/register", { username, rsaEncryptedPassword, licenseKey }, "POST");
	if (json.Status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.Result;
}

export async function validateAccessToken() {
	const json = await authFetch("/User/ValidateToken");
	return json.Status == "SUCCESS";
}

export async function includeDesign(designID: DesignID) {
	const json = await authFetch("/User/IncludeDesign", { designID }, "POST");
	if (json.Status != "SUCCESS") throw new Error("Unsuccessful server response");
}

// Level
export async function getLevels() {
	const json = await authFetch<Level[]>("/LevelTemplate/GetAll");
	if (json.Status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.Result;
}

export async function getLevel(levelID: string | number) {
	const json = await authFetch<Level>("/LevelTemplate/Get", { levelID });
	if (json.Status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.Result;
}

// Machine Design
export async function createMachine(machine: SaveableTuringMachine) {
	const json = await authFetch<DesignID>("/MachineDesign/Create", {}, "POST", machine);
	if (json.Status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.Result;
}

export async function updateMachine(designID: DesignID, machine: SaveableTuringMachine) {
	const json = await authFetch("/MachineDesign/Update", { designID }, "POST", machine);
	if (json.Status != "SUCCESS") throw new Error("Unsuccessful server response");
}

export async function deleteMachine(designID: DesignID) {
	const json = await authFetch("/MachineDesign/Delete", { designID }, "POST");
	if (json.Status != "SUCCESS") throw new Error("Unsuccessful server response");
}

export async function getMachine(designID: DesignID) {
	try {
		const json = await authFetch<SaveableTuringMachine>("/MachineDesign/Get", { designID }, "POST");
		if (json.Status != "SUCCESS") return undefined;
		return json.Result;
	} catch (err) {
		console.error(err);
		return undefined;
	}
}

export async function submitMachine(machine: SaveableTuringMachine, levelID: number) {
	const json = await authFetch("/Progress/Update", { levelID, isSolved: "true" }, "POST", machine);
	if (json.Status != "SUCCESS") throw new Error("Unsuccessful server response");
}

export async function saveMachine(machine: SaveableTuringMachine, levelID: number): Promise<CloudSaveResult> {
	const json = await authFetch("/Progress/Update", { levelID, isSolved: "false" }, "POST", machine);
	if (json.Status != "SUCCESS") return { error: true, message: json.Status };
	return { error: false };
}

export async function createProgress(levelID: number) {
	const json = await authFetch<DesignID>("/Progress/Create", { levelID }, "POST");
	if (json.Status != "SUCCESS") throw new Error("Unsuccessful server response");
	return json.Result;
}

export async function getLevelProgress(levelID: number) {
	try {
		const json = await authFetch<CloudProgress & { SubmittedTime: string }>("/Progress/Get", { levelID });
		if (json.Status != "SUCCESS") return undefined;
		// Get timezone from server time, set timezone for save time
		(json.Result as CloudProgress).SubmittedTime = DateTime.fromISO(json.Result.SubmittedTime).setZone(DateTime.fromISO(json.ResponseTime).zone).toMillis();
		return json.Result as CloudProgress;
	} catch (err) {
		console.error(err);
		return undefined;
	}
}

export async function getAllProgress() {
	try {
		const json = await authFetch<(CloudProgress & { SubmittedTime: string })[]>("/Progress/GetAll");
		if (json.Status != "SUCCESS") return undefined;
		return json.Result.map(progress => {
			// Get timezone from server time, set timezone for save time
			(progress as CloudProgress).SubmittedTime = DateTime.fromISO(progress.SubmittedTime).setZone(DateTime.fromISO(json.ResponseTime).zone).toMillis();
			return progress;
		});
	} catch (err) {
		console.error(err);
		return undefined;
	}
}

export function startAutoValidate() {
	setTimeout(() => {
		validateAccessToken().catch(console.error);
		startAutoValidate();
	}, 20 * 60 * 1000); // validate every 20 minutes
}