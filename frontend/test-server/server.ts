import cors from "cors";
import * as crypto from "crypto";
import express, { Request, Response } from "express";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";

// arbitary delay
const DELAY = 2000;

// test credentials
const LICENSE = "69420";

// prepare directories
mkdirSync("assets/levels", { recursive: true });
mkdirSync("assets/machines", { recursive: true });
mkdirSync("assets/users", { recursive: true });

// stored users
type User = {
	username: string;
	hashedPassword: string;
	accessTokens?: string;
};
const tokenMap = new Map<string, User>();
const users: { [key: string]: User } = {};
// load users
for (const file of readdirSync("assets/users")) {
	if (file.endsWith(".json")) {
		const user = JSON.parse(readFileSync(`assets/users/${file}`, "utf8")) as User;
		const username = file.split(".").slice(0, -1).join(".");
		user.username = username;
		users[username] = user;
		if (user.accessTokens) tokenMap.set(user.accessTokens, user);
	}
}

const LEVEL_NAMES = [
	"hello-world",
	"rev-str",
	"what",
	"abs",
	"rev-double",
	"div-3"
];

// helper functions
function delay() {
	return new Promise(res => setTimeout(res, DELAY));
}

const wrapFile = (path: string) => {
	if (!existsSync(path)) return { status: "NO_SUCH_ITEM" };
	const content = readFileSync(path, "utf8");
	return { status: "SUCCESS", result: JSON.parse(content) };
};

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
	responseStackTraces?: string;
}

type SuccessfulServerResponse<T> = {
	time: string;
	status: "SUCCESS";
	result: T;
}

const sendResponse = <T>(res: Response, status: UnsuccessfulServerResponse["status"] | SuccessfulServerResponse<T>["status"], data?: T, code?: number) => {
	if (code) res.status(code);
	if (status == "SUCCESS") {
		if (data) res.json({ status, time: new Date().toISOString(), result: data });
		else res.json({ status, time: new Date().toISOString() });
	}
	else res.json({ status, time: new Date().toISOString(), responseStackTraces: data });
};

const keys = crypto.generateKeyPairSync("rsa", {
	modulusLength: 4096,
  publicKeyEncoding: {
    type: 'pkcs1',
    format: 'pem'
  },
	privateKeyEncoding: {
    type: 'pkcs1',
    format: 'pem'
  }
});

const validateToken = (req: Request) => {
	const token = req.query.accessToken as string;
	if (!token) return undefined;
	return tokenMap.get(token);
};

const sha256 = (data: string) => {
	return crypto.hash("sha256", data, "hex");
};

const app = express();
app.use(cors());
app.use(express.json());

// Landing
app.get("/api/try-get-response", async (_req, res) => {
	await delay();
	res.sendStatus(200);
});

app.get("/api/validate", (req, res) => {
	if (!validateToken(req)) return sendResponse(res, "INVALID_TOKEN", undefined, 401);
	sendResponse(res, "SUCCESS");
});

app.get("/api/progress", (req, res) => {
	// verify access token
	const user = validateToken(req);
	if (!user) return sendResponse(res, "INVALID_TOKEN", undefined, 403);
	if (existsSync(`assets/users/${user.username}/progress.json`))
		res.json(wrapFile(`assets/users/${user.username}/progress.json`));
	else res.json({ level: null, machine: null, time: new Date(0).toISOString(), isSolved: false });
});

app.get("/api/get-rsa-key", (_req, res) => {
	sendResponse(res, "SUCCESS", keys.publicKey);
});

// Login
app.post("/api/login", (req, res) => {
	const username = req.query.username as string;
	const password = req.query.hashedPassword as string;
	const salt = req.query.salt as string;
	// verify all fields exist
	if (!username || !password || !salt)
		return sendResponse(res, "INVALID_USERNAME_OR_PASSWORD", undefined, 400);
	// verify username exists
	const user = users[username];
	if (!user)
		return sendResponse(res, "USER_NOT_FOUND", undefined, 401);
	// verify user password
	const hashed = sha256(user.hashedPassword + salt);
	if (password != hashed)
		return sendResponse(res, "INVALID_USERNAME_OR_PASSWORD", undefined, 401);
	// generate, store, return access token
	const token = crypto.randomUUID();
	if (user.accessTokens) tokenMap.delete(user.accessTokens);
	user.accessTokens = token;
	tokenMap.set(token, user);
	sendResponse(res, "SUCCESS", { accessToken: token });
	writeFileSync(`assets/users/${username}.json`, JSON.stringify(user));
});

app.post("/api/register", (req, res) => {
	const username = req.query.username as string;
	const password = req.query.rsaEncryptedPassword as string;
	const licenseKey = req.query.licenseKey as string;
	// verify all fields exist
	if (!username || !password || !licenseKey)
		return sendResponse(res, "INVALID_USERNAME_OR_PASSWORD", undefined, 400);
	// verify license key valid
	if (licenseKey != LICENSE)
		return sendResponse(res, "INVALID_LICENSE", undefined, 400);
	// decrypt password
	const decrypted = crypto.privateDecrypt(
		{ key: keys.privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
		Buffer.from(password, "base64")
	).toString();
	// store new user
	const token = crypto.randomUUID();
	users[username] = { username: username, hashedPassword: sha256(decrypted), accessTokens: token };
	tokenMap.set(token, users[username]);
	sendResponse(res, "SUCCESS", token);
	writeFileSync(`assets/users/${username}.json`, JSON.stringify(users[username]));
});

// Levels
app.get("/api/levels", async (req, res) => {
	if (!validateToken(req)) return sendResponse(res, "INVALID_TOKEN", undefined, 403);
	const levels: any[] = [];
	for (const file of readdirSync("assets/levels")) {
		if (!file.endsWith(".json")) continue;
		const { result: level } = wrapFile("assets/levels/" + file);
		levels.push({
			levelID: level.levelID,
			title: level.title,
			description: level.description,
			parent: level.parents ? level.parents[0] : undefined
		});
	}
	sendResponse(res, "SUCCESS", levels.sort((a, b) => a.levelID - b.levelID));
});

app.get("/api/level", async (req, res) => {
	// verify access token
	const user = validateToken(req);
	if (!user) return sendResponse(res, "INVALID_TOKEN", undefined, 403);
	// Check level
	const levelID = parseInt(req.query.levelID as string);
	if (isNaN(levelID)) return sendResponse(res, "NO_SUCH_ITEM", undefined, 404);
	// special case for sandbox
	if (levelID == 255) {
		const { result: machine } = wrapFile(`assets/users/${user.username}/sandbox.json`);
		res.json({ design: machine });
		return;
	}
	// copy level if user doesn't have their own instance
	const levelName = LEVEL_NAMES[levelID];
	if (!existsSync(`assets/users/${user.username}/levels/${levelName}.json`)) {
		if (!existsSync(`assets/levels/${levelName}.json`)) return sendResponse(res, "NO_SUCH_ITEM", undefined, 404);
		mkdirSync(`assets/users/${user.username}/levels`, { recursive: true });
		copyFileSync(`assets/levels/${levelName}.json`, `assets/users/${user.username}/levels/${levelName}.json`);
	}
	// read file from user's level instance
	res.json(wrapFile(`assets/users/${user.username}/levels/${levelName}.json`));
});

// Designer
app.post("/api/level", (req, res) => {
	const user = validateToken(req);
	if (!user) return sendResponse(res, "INVALID_TOKEN", undefined, 403);
	// Check fields
	const levelID = parseInt(req.query.levelID as string);
	const operations = parseInt(req.query.operations as string);
	if (isNaN(levelID) || isNaN(operations)) return sendResponse(res, "NO_SUCH_ITEM", undefined, 404);
	// copy level if user doesn't have their own instance
	const levelName = LEVEL_NAMES[levelID];
	if (!existsSync(`assets/users/${user.username}/levels/${levelName}.json`)) {
		if (!existsSync(`assets/levels/${levelName}.json`)) return sendResponse(res, "NO_SUCH_ITEM", undefined, 404);
		copyFileSync(`assets/levels/${levelName}.json`, `assets/users/${user.username}/levels/${levelName}.json`);
	}
	// verify machine exists
	const machine = req.body;
	if (!machine) return sendResponse(res, "BACKEND_ERROR", "No machine supplied", 400);
	// it's correct, store operations
	const { result: level } = wrapFile(`assets/users/${user.username}/levels/${levelName}.json`);
	level.design = machine;
	level.isSolved = true;
	level.operations = operations;

	// save the user level progress
	writeFileSync(`assets/users/${user.username}/levels/${levelName}.json`, JSON.stringify(level));

	// calculate percentage from other submissions
	const submissions = [operations];
	for (const user of readdirSync("assets/users")) {
		const stat = statSync("assets/users/" + user);
		if (!stat.isDirectory() || !existsSync(`assets/users/${user}/levels/${levelID}.json`)) continue;
		const file = wrapFile(`assets/users/${user}/levels/${levelID}.json`);
		if (file.result.operations >= 0) submissions.push(file.result.operations);
	}

	const rank = submissions.sort().indexOf(operations);
	sendResponse(res, "SUCCESS", (submissions.length - rank) / submissions.length);
});

app.post("/api/save", (req, res) => {
	const user = validateToken(req);
	if (!user) return sendResponse(res, "INVALID_TOKEN", undefined, 403);
	let levelID = parseInt(req.query.levelID as string);
	if (isNaN(levelID)) levelID = 255;
	// verify all fields exist
	if (req.body === undefined)
		return sendResponse(res, "BACKEND_ERROR", "No machine", 400);
	writeFileSync(`assets/users/${user.username}/progress.json`, JSON.stringify({ level: levelID, machineDesign: req.body, time: new Date().toISOString(), isSolved: false }));
	if (levelID == 255) writeFileSync(`assets/users/${user.username}/sandbox.json`, JSON.stringify(req.body));
	else {
		const { result: level } = wrapFile(`assets/users/${user.username}/levels/${LEVEL_NAMES[levelID]}.json`);
		level.design = req.body;
		writeFileSync(`assets/users/${user.username}/levels/${LEVEL_NAMES[levelID]}.json`, JSON.stringify(level));
	}
	sendResponse(res, "SUCCESS");
});

app.post("/api/upload", (req, res) => {
	const user = validateToken(req);
	if (!user) return sendResponse(res, "INVALID_TOKEN", 403);
	// verify all fields exist
	if (!req.body)
		return sendResponse(res, "BACKEND_ERROR", "No machine", 400);
	// store machine
	const id = crypto.randomUUID();
	writeFileSync(`assets/machines/${id}.json`, JSON.stringify(req.body));
	sendResponse(res, "SUCCESS", id);
});

app.get("/api/import", (req, res) => {
	const user = validateToken(req);
	if (!user) return sendResponse(res, "INVALID_TOKEN", undefined, 403);
	// check id
	const designID = req.query.designID as string;
	// verify machine id is valid
	if (!designID || !existsSync(`assets/machines/${designID}.json`))
		return sendResponse(res, "NO_SUCH_ITEM", undefined, 404);
	// return the machine
	res.json(wrapFile(`assets/machines/${designID}.json`));
});

app.get("/api/stat", (req, res) => {
	const user = validateToken(req);
	if (!user) return sendResponse(res, "INVALID_TOKEN", undefined, 403);
	const levelID = parseInt(req.query.levelID as string);
	if (isNaN(levelID)) return sendResponse(res, "NO_SUCH_ITEM", undefined, 404);

	const levelName = LEVEL_NAMES[levelID];
	if (!existsSync(`assets/users/${user.username}/levels/${levelName}.json`))
		return sendResponse(res, "SUCCESS", null);
	const { result: level } = wrapFile(`assets/users/${user.username}/levels/${levelName}.json`);

	if (level.operations < 0) return sendResponse(res, "SUCCESS", null);

	// calculate percentage from other submissions
	const submissions = [level.operations];
	for (const user of readdirSync("assets/users")) {
		const stat = statSync("assets/users/" + user);
		if (!stat.isDirectory() || !existsSync(`assets/users/${user}/levels/${levelID}.json`)) continue;
		const file = wrapFile(`assets/users/${user}/levels/${levelID}.json`);
		if (file.result.operations >= 0) submissions.push(file.result.operations);
	}

	const rank = submissions.sort().indexOf(level.operations);
	sendResponse(res, "SUCCESS", (submissions.length - rank) / submissions.length);
});

app.listen(3100, () => console.log("Listening..."));
