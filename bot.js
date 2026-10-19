
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import pino from "pino";
import QRCode from "qrcode";
import fs from "fs";
import { routeCommand } from "./index.js";

let sock = null;
let latestQrBase64 = null;
let connectionStatus = "Disconnected";
let isStarting = false;

export async function startWhatsApp(broadcast) {
  // Prevent multiple simultaneous connection attempts.
  if (isStarting) {
    return {
      getStatus: () => connectionStatus,
      getQR: () => latestQrBase64
    };
  }

  isStarting = true;

  try {
    const { state, saveCreds } =
      await useMultiFileAuthState("auth_info_baileys");

    // Create the WhatsApp connection.
    // printQRInTerminal was removed because it is deprecated.
    sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Generate a QR image and send it to the dashboard.
      if (qr) {
        try {
          latestQrBase64 = await QRCode.toDataURL(qr);

          broadcast({
            type: "qr",
            qr: latestQrBase64
          });
        } catch (error) {
          console.error("Failed to generate WhatsApp QR:", error);
        }
      }

      if (connection === "connecting") {
        connectionStatus = "Connecting";

        broadcast({
          type: "status",
          status: connectionStatus
        });
      }

      if (connection === "close") {
        const statusCode =
          lastDisconnect?.error?.output?.statusCode;

        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut;

        connectionStatus = "Disconnected";
        latestQrBase64 = null;

        broadcast({
          type: "status",
          status: connectionStatus
        });

        if (shouldReconnect) {
          // Allow the current start attempt to finish before reconnecting.
          isStarting = false;
          setTimeout(() => {
            startWhatsApp(broadcast).catch((error) => {
              console.error("WhatsApp reconnection failed:", error);
            });
          }, 3000);
        } else {
          console.log(
            "WhatsApp logged out. Please restart and link the account again."
          );
        }
      }

      if (connection === "open") {
        connectionStatus = "Connected";
        latestQrBase64 = null;

        broadcast({
          type: "status",
          status: connectionStatus
        });

        console.log("WhatsApp connected successfully.");
      }
    });

    // Process incoming WhatsApp messages.
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        if (!remoteJid) continue;

        try {
          const config = JSON.parse(
            fs.readFileSync("./config.json", "utf8")
          );

          const body =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            "";

          // Run bot commands beginning with the configured prefix.
          if (body.startsWith(config.prefix)) {
            await routeCommand(sock, msg, body, config);
            continue;
          }

          // Send auto-replies to individual chats, not groups.
          if (
            config.autoReply?.enabled &&
            !remoteJid.endsWith("@g.us")
          ) {
            await sock.sendMessage(
              remoteJid,
              { text: config.autoReply.message },
              { quoted: msg }
            );
          }
        } catch (error) {
          console.error("Error processing incoming message:", error);
        }
      }
    });

    return {
      getStatus: () => connectionStatus,
      getQR: () => latestQrBase64
    };
  } catch (error) {
    isStarting = false;
    connectionStatus = "Disconnected";

    console.error("Failed to start WhatsApp:", error);
    throw error;
  } finally {
    // Keep the startup lock while the socket is active.
    // The connection close handler releases it before reconnecting.
    if (!sock) {
      isStarting = false;
    }
  }
}
