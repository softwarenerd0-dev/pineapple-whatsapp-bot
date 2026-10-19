import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { startWhatsApp } from "./bot.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((c) => { if (c.readyState === 1) c.send(payload); });
}

let botInstance = await startWhatsApp(broadcast);

app.get("/api/config", (req, res) => res.json(JSON.parse(fs.readFileSync("./config.json"))));
app.post("/api/config", (req, res) => {
  fs.writeFileSync("./config.json", JSON.stringify(req.body, null, 2));
  broadcast({ type: "config", config: req.body });
  res.json({ success: true });
});

app.get("/api/system", (req, res) => {
  res.json({
    platform: os.platform(),
    uptime: Math.floor(os.uptime()),
    freeMem: Math.floor(os.freemem() / 1024 / 1024),
    status: botInstance.getStatus()
  });
});

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({
    type: "init",
    status: botInstance.getStatus(),
    qr: botInstance.getQR(),
    config: JSON.parse(fs.readFileSync("./config.json"))
  }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Pineapple Panel running on port: ${PORT}`);
});