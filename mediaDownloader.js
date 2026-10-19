import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

export async function handleMedia(sock, chatId, msg, cmd, url) {
  if (!url) return sock.sendMessage(chatId, { text: `⚠️ Provide a link: .${cmd} <URL>` }, { quoted: msg });
  const isAudio = ["ytmp3", "soundcloud"].includes(cmd);
  const outPath = `./temp_${Date.now()}.${isAudio ? "mp3" : "mp4"}`;
  await sock.sendMessage(chatId, { text: "⏳ Processing media..." }, { quoted: msg });
  try {
    if (isAudio) {
      await execAsync(`yt-dlp --extract-audio --audio-format mp3 -o "${outPath}" "${url}"`);
      await sock.sendMessage(chatId, { audio: fs.readFileSync(outPath), mimetype: "audio/mp4" }, { quoted: msg });
    } else {
      await execAsync(`yt-dlp -f "best[ext=mp4][height<=720]/best" -o "${outPath}" "${url}"`);
      await sock.sendMessage(chatId, { video: fs.readFileSync(outPath), caption: `✅ Downloaded via .${cmd}` }, { quoted: msg });
    }
  } catch (err) {
    await sock.sendMessage(chatId, { text: `❌ Error: ${err.message}` }, { quoted: msg });
  } finally {
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  }
}