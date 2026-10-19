export async function handleGroupAdmin(sock, chatId, msg, cmd, args) {
  if (!chatId.endsWith("@g.us")) return sock.sendMessage(chatId, { text: "❌ Group command only." }, { quoted: msg });
  const metadata = await sock.groupMetadata(chatId);
  const participants = metadata.participants;

  if (cmd === "tagall") {
    let text = `📢 *ANNOUNCEMENT:* ${args.join(" ") || "Attention"}\n\n`;
    participants.forEach((p) => { text += `@${p.id.split("@")[0]}\n`; });
    await sock.sendMessage(chatId, { text, mentions: participants.map((p) => p.id) });
  } else if (cmd === "mute") {
    await sock.groupSettingUpdate(chatId, "announcement");
    await sock.sendMessage(chatId, { text: "🔒 Group muted. Admins only." });
  } else if (cmd === "unmute") {
    await sock.groupSettingUpdate(chatId, "not_announcement");
    await sock.sendMessage(chatId, { text: "🔓 Group unmuted." });
  }
}