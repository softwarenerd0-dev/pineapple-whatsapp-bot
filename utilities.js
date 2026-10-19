import axios from "axios";
import QRCode from "qrcode";

export async function handleUtilities(sock, chatId, msg, cmd, args) {
  const query = args.join(" ");
  if (cmd === "weather") {
    const res = await axios.get(`https://wttr.in/${encodeURIComponent(query || "London")}?format=3`);
    await sock.sendMessage(chatId, { text: `🌤️ ${res.data}` }, { quoted: msg });
  } else if (cmd === "calc") {
    // Restrict input to arithmetic characters and use a small parser, never eval/Function.
    if (!query || !/^[0-9+\-*/().\s]+$/.test(query)) {
      return sock.sendMessage(chatId, { text: "Send an arithmetic expression, e.g. .calc (12+3)*4" }, { quoted: msg });
    }
    try {
      const { create, all } = await import("mathjs");
      const math = create(all, { predictable: true });
      const result = math.evaluate(query);
      if (typeof result !== "number" || !Number.isFinite(result)) throw new Error("Invalid result");
      await sock.sendMessage(chatId, { text: `🧮 Result: ${result}` }, { quoted: msg });
    } catch {
      await sock.sendMessage(chatId, { text: "Invalid arithmetic expression." }, { quoted: msg });
    }
  } else if (cmd === "qrcode") {
    const buf = await QRCode.toBuffer(query || "Pineapple");
    await sock.sendMessage(chatId, { image: buf }, { quoted: msg });
  }
}