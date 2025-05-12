import cors from "cors";
import "dotenv/config";
import express from "express";
import proxy from "express-http-proxy";

const BACKEND = process.env.BACKEND;
if (!BACKEND) throw new Error("No backend host provided");

const app = express();
app.use(cors());
app.use(express.static(__dirname + "/dist"));
app.use("/api", proxy(BACKEND + "/api"));

app.get("/", (_req, res) => {
	res.sendFile(__dirname + "/dist/index.html");
});

app.get("/:page", (_req, res) => {
	res.sendFile(__dirname + "/dist/index.html");
});

app.listen(process.env.PORT || 3100, () => console.log("Proxy listening..."));