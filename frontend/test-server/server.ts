import bcrypt from "bcrypt";
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
	accessTokens?: string[];
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
		for (const token of user.accessTokens || [])
			tokenMap.set(token, user);
	}
}

// dynamic flags
let submissionCorrect = false;

// helper functions
function delay() {
	return new Promise(res => setTimeout(res, DELAY));
}

const wrapFile = (path: string) => {
	if (!existsSync(path)) return { success: false, errcode: "NOT_FOUND" };
	const content = readFileSync(path, "utf8");
	return { success: true, data: JSON.parse(content) };
};

const sendResponse = (res: Response, success: boolean, data?: any, code?: number) => {
	if (code) res.status(code);
	if (success) {
		if (data) res.json({ success, data });
		else res.json({ success });
	}
	else res.json({ success: false, errcode: data });
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
	if (req.headers.authorization?.startsWith("Bearer ")) {
		const token = req.headers.authorization.slice(7);
		const decrypted = crypto.privateDecrypt(
			{ key: keys.privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
			Buffer.from(token, "base64")
		).toString();
		return tokenMap.get(decrypted);
	}
	return undefined;
};

const app = express();
app.use(cors());
app.use(express.json());

// Landing
app.get("/api/getserverresponse", async (_req, res) => {
	await delay();
	res.sendStatus(200);
});

app.get("/api/validate", (req, res) => {
	if (!validateToken(req)) return sendResponse(res, false, "INVALID_TOKEN", 401);
	sendResponse(res, true);
});

app.get("/api/progress", (req, res) => {
	// verify access token
	const user = validateToken(req);
	if (!user) return sendResponse(res, false, "INVALID_TOKEN", 403);
	if (existsSync(`assets/users/${user.username}/progress.json`))
		res.json(wrapFile(`assets/users/${user.username}/progress.json`));
	else res.json({ level: null, machine: null, timestamp: 0 });
});

app.get("/api/pubkey", (_req, res) => {
	sendResponse(res, true, { key: keys.publicKey });
});

// Login
app.post("/api/login", (req, res) => {
	console.log("login username:", req.body.username);
	console.log("login password:", req.body.password);
	console.log("login salt:", req.body.salt);
	// verify all fields exist
	if (!req.body.username || !req.body.password || !req.body.salt)
		return sendResponse(res, false, "MISSING_FIELDS", 400);
	// verify username exists
	const user = users[req.body.username];
	if (!user)
		return sendResponse(res, false, "NOT_FOUND", 401);
	// verify user password
	console.log("login hashed:", user.hashedPassword);
	const hashed = bcrypt.hashSync(user.hashedPassword, req.body.salt);
	console.log("login salt-hashed:", hashed);
	if (req.body.password != hashed)
		return sendResponse(res, false, "WRONG_CREDENTIALS", 401);
	// generate, store, return access token
	const token = crypto.randomUUID();
	if (user.accessTokens) user.accessTokens.push(token);
	else user.accessTokens = [token];
	tokenMap.set(token, user);
	sendResponse(res, true, { accessToken: token });
	writeFileSync(`assets/users/${req.body.username}.json`, JSON.stringify(user));
});

app.post("/api/register", (req, res) => {
	console.log("register username:", req.body.username);
	console.log("register password:", req.body.password);
	console.log("register licenseKey:", req.body.licenseKey);
	// verify all fields exist
	if (!req.body.username || !req.body.password || !req.body.licenseKey)
		return sendResponse(res, false, "MISSING_FIELDS", 400);
	// verify license key valid
	if (req.body.licenseKey != LICENSE)
		return sendResponse(res, false, "INVALID_LICENSE_KEY", 400);
	// decrypt password
	const decrypted = crypto.privateDecrypt(
		{ key: keys.privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
		req.body.password
	).toString();
	console.log("register decrypted password:", decrypted);
	// store new user
	const token = crypto.randomUUID();
	users[req.body.username] = { username: req.body.username, hashedPassword: decrypted, accessTokens: [token] };
	tokenMap.set(token, users[req.body.username]);
	sendResponse(res, true, { accessToken: token });
	writeFileSync(`assets/users/${req.body.username}.json`, JSON.stringify(users[req.body.username]));
});

// Levels
app.get("/api/levels", async (req, res) => {
	if (!validateToken(req)) return sendResponse(res, false, "INVALID_TOKEN", 403);
	res.json(wrapFile("assets/levels.json"));
});

app.get("/api/level/:id", async (req, res) => {
	// verify access token
	const user = validateToken(req);
	if (!user) return sendResponse(res, false, "INVALID_TOKEN", 403);
	// copy level if user doesn't have their own instance
	if (!existsSync(`assets/users/${user.username}/levels/${req.params.id}.json`)) {
		if (!existsSync(`assets/levels/${req.params.id}.json`)) return sendResponse(res, false, "NOT_FOUND", 404);
		mkdirSync(`assets/users/${user.username}/levels`, { recursive: true });
		copyFileSync(`assets/levels/${req.params.id}.json`, `assets/users/${user.username}/levels/${req.params.id}.json`);
	}
	// read file from user's level instance
	res.json(wrapFile(`assets/users/${user.username}/levels/${req.params.id}.json`));
});

// Designer
app.post("/api/level/:id", (req, res) => {
	const user = validateToken(req);
	if (!user) return sendResponse(res, false, "INVALID_TOKEN", 403);
	// copy level if user doesn't have their own instance
	if (!existsSync(`assets/users/${user.username}/levels/${req.params.id}.json`)) {
		if (!existsSync(`assets/levels/${req.params.id}.json`)) return sendResponse(res, false, "NOT_FOUND", 404);
		copyFileSync(`assets/levels/${req.params.id}.json`, `assets/users/${user.username}/levels/${req.params.id}.json`);
	}
	// verify machine exists
	const machine = req.body.machine;
	if (!machine) return sendResponse(res, false, "MISSING_FIELD", 400);
	// TODO: verfiy machine
	// arbitary grade correctness
	const { data: level } = wrapFile(`assets/users/${user.username}/levels/${req.params.id}.json`);
	level.machine = machine;
	if (submissionCorrect) {
		level.solved = true;
		sendResponse(res, true, { correct: true, rank: Math.ceil(Math.random() * 10) });
	} else sendResponse(res, true, { correct: false });
	// save the user level progress
	writeFileSync(`assets/users/${user.username}/levels/${req.params.id}.json`, JSON.stringify(level));
});

app.post("/api/save", (req, res) => {
	const user = validateToken(req);
	if (!user) return sendResponse(res, false, "INVALID_TOKEN", 403);
	// verify all fields exist
	if (req.body.level === undefined || req.body.machine === undefined)
		return sendResponse(res, false, "MISSING_FIELDS", 400);
	writeFileSync(`assets/users/${user.username}/progress.json`, JSON.stringify({ level: req.body.level, machine: req.body.machine, timestamp: Date.now() }));
	sendResponse(res, true, { timestamp: Date.now() });
});

app.post("/api/upload", (req, res) => {
	const user = validateToken(req);
	if (!user) return sendResponse(res, false, "INVALID_TOKEN", 403);
	// verify all fields exist
	if (!req.body.machine)
		return sendResponse(res, false, "MISSING_FIELDS", 400);
	// store machine
	const id = crypto.randomUUID();
	writeFileSync(`assets/machines/${id}.json`, JSON.stringify({ machine: req.body.machine }));
	sendResponse(res, true, { id });
});

app.get("/api/import/:id", (req, res) => {
	const user = validateToken(req);
	if (!user) return sendResponse(res, false, "INVALID_TOKEN", 403);
	// verify machine id is valid
	if (!existsSync(`assets/machines/${req.params.id}.json`))
		return sendResponse(res, false, "NOT_FOUND", 404);
	// return the machine
	res.json(wrapFile(`assets/machines/${req.params.id}.json`));
});

app.listen(3100, () => console.log("Listening..."));
