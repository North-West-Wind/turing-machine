import cors from "cors";
import express from "express";
import { readFileSync } from "fs";

// arbitary delay
const DELAY = 2000;

// helper functions
function delay() {
	return new Promise(res => setTimeout(res, DELAY));
}

const wrapFile = (path) => {
	const content = readFileSync(path, "utf8");
	return { success: true, data: JSON.parse(content) };
};

const app = express();
app.use(cors())

app.get("/api/getserverresponse", async (_req, res) => {
	await delay();
	res.sendStatus(200);
});

app.get("/api/levels", async (_req, res) => {
	await delay();
	res.json(wrapFile("assets/levels.json"));
});

app.get("/api/level/abc", async (_req, res) => {
	await delay();
	res.json(wrapFile("assets/level_abc.json"));
});

app.listen(3100, () => console.log("Listening..."));