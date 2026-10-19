import { downloadMediaMessage } from "@whiskeysockets/baileys";
import sharp from "sharp";
import fs from "fs";

export async function handleCreative(sock, chatId, msg, cmd) {
  const isQuoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  const isDirect = msg.message?.imageMessage;
  if (!isDirect && !isQuoted) return sock.sendMessage(chatId, { text: "⚠️ Reply to an image." }, { quoted: msg });

  const media = isDirect ? msg : { message: msg.message.extendedTextMessage.contextInfo.quotedMessage };
  const buffer = await downloadMediaMessage(media, "buffer", {});
  const tempWebp = `./s_${Date.now()}.webp`;

  try {
    await sharp(buffer).resize(512, 512, { fit: "contain" }).webp().toFile(tempWebp);
    await sock.sendMessage(chatId, { sticker: fs.readFileSync(tempWebp) }, { quoted: msg });
  } finally {
    if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp);
  }
}