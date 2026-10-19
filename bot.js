import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import fs from "fs";
import { routeCommand } from "./index.js";

let sock = null;
let latestQrBase64 = null;
let connectionStatus = "Disconnected";

export async function startWhatsApp(broadcast) {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      latestQrBase64 = await QRCode.toDataURL(qr);
      broadcast({ type: "qr", qr: latestQrBase64 });
    }
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      connectionStatus = "Disconnected";
      broadcast({ type: "status", status: connectionStatus });
      if (shouldReconnect) startWhatsApp(broadcast);
    } else if (connection === "open") {
      connectionStatus = "Connected";
      latestQrBase64 = null;
      broadcast({ type: "status", status: connectionStatus });
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const config = JSON.parse(fs.readFileSync("./config.json"));
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    if (body.startsWith(config.prefix)) {
      await routeCommand(sock, msg, body, config);
      return;
    }

    if (config.autoReply.enabled && !msg.key.remoteJid.endsWith("@g.us")) {
      await sock.sendMessage(msg.key.remoteJid, { text: config.autoReply.message }, { quoted: msg });
    }
  });

  return { getStatus: () => connectionStatus, getQR: () => latestQrBase64 };
}