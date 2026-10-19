import { handleHackCommands } from "./hackAnimations.js";
import { handleMedia } from "./mediaDownloader.js";
import { handleGroupAdmin } from "./groupAdmin.js";
import { handleCreative } from "./creativeAi.js";
import { handleUtilities } from "./utilities.js";

export async function routeCommand(sock, msg, rawText, config) {
  const chatId = msg.key.remoteJid;
  const [invokedCmd, ...args] = rawText.slice(config.prefix.length).trim().split(/\s+/);
  const cmd = invokedCmd.toLowerCase();

  if (["matrix"].includes(cmd)) return handleHackCommands(sock, chatId, msg, cmd, args);
  if (["ytmp3", "ytmp4", "tiktok", "igdl", "fbdl", "play", "video"].includes(cmd)) return handleMedia(sock, chatId, msg, cmd, args[0]);
  if (["tagall", "mute", "unmute"].includes(cmd)) return handleGroupAdmin(sock, chatId, msg, cmd, args);
  if (["sticker", "s"].includes(cmd)) return handleCreative(sock, chatId, msg, cmd);
  if (["weather", "calc", "qrcode"].includes(cmd)) return handleUtilities(sock, chatId, msg, cmd, args);
  if (["ai", "ask"].includes(cmd)) {
    const prompt = args.join(" ").trim();
    if (!prompt) return sock.sendMessage(chatId, { text: "Usage: .ai your question" }, { quoted: msg });
    if (!process.env.OPENAI_API_KEY) return sock.sendMessage(chatId, { text: "AI is not configured yet. Set OPENAI_API_KEY in Railway Variables." }, { quoted: msg });
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 700 });
    return sock.sendMessage(chatId, { text: completion.choices[0]?.message?.content || "I could not generate a response." }, { quoted: msg });
  }

  if (cmd === "ping") {
    const start = Date.now();
    const sent = await sock.sendMessage(chatId, { text: "🏓 Pinging..." }, { quoted: msg });
    return sock.sendMessage(chatId, { text: `🍍 *Pong:* \`${Date.now() - start}ms\``, edit: sent.key });
  }
  if (cmd === "help") {
    return sock.sendMessage(chatId, { text: "*🍍 PINEAPPLE BOT MENU*\n\n• .ping\n• .ai <question>\n• .matrix\n• .play <url>\n• .video <url>\n• .sticker\n• .weather <city>\n• .calc <math>\n• .qrcode <text>\n• .tagall <msg>" }, { quoted: msg });
  }
}