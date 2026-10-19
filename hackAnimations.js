const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Harmless visual-only Matrix animation. No network attacks or credential-cracking.
export async function handleHackCommands(sock, chatId, senderMsg, cmd) {
  if (cmd !== "matrix") return;
  const sent = await sock.sendMessage(chatId, { text: "```[CONNECTING TO PINEAPPLE MATRIX...]```" }, { quoted: senderMsg });
  for (const frame of [
    "```01010110 01101001 01110010 01110101 01110011```",
    "```[SIMULATION ONLY] ACCESS VISUALIZED```",
    "```🍍 PINEAPPLE MATRIX READY```"
  ]) {
    await delay(700);
    await sock.sendMessage(chatId, { text: frame, edit: sent.key });
  }
}
