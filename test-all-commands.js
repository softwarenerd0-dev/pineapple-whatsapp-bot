
/**
 * Pineapple WhatsApp Bot — Offline Command Tester
 * File: test-all-commands.js
 * Location: Repository root, beside index.js and package.json
 *
 * This is a starter test list, not a guarantee that every command
 * in your project is covered.
 */

import fs from "node:fs";
import { routeCommand } from "./index.js";

const configUrl = new URL("./config.json", import.meta.url);

let config = {};

if (fs.existsSync(configUrl)) {
  config = JSON.parse(fs.readFileSync(configUrl, "utf8"));
}

config.prefix ??= ".";

// Add or remove commands to match your actual bot.
const commandsToTest = [
  `${config.prefix}help`,
  `${config.prefix}ping`,
  `${config.prefix}menu`,
  `${config.prefix}matrix`,
  `${config.prefix}calc 2 + 2`,
];

const results = [];

for (const command of commandsToTest) {
  const replies = [];

  // Fake WhatsApp socket: captures replies without sending them.
  const fakeSocket = {
    async sendMessage(chatId, content) {
      replies.push({ chatId, content });

      return {
        key: { id: "OFFLINE-TEST-MESSAGE" },
      };
    },
  };

  const fakeMessage = {
    key: {
      remoteJid: "offline-test@s.whatsapp.net",
      fromMe: false,
      id: `TEST-${results.length + 1}`,
    },
    pushName: "Offline Tester",
    message: {
      conversation: command,
    },
  };

  try {
    await routeCommand(
      fakeSocket,
      fakeMessage,
      command,
      config
    );

    results.push({
      command,
      status: "COMPLETED",
      repliesCaptured: replies.length,
      replies,
    });
  } catch (error) {
    results.push({
      command,
      status: "ERROR",
      error: error.message,
    });
  }
}

console.log("\n=== PINEAPPLE BOT TEST RESULTS ===\n");

for (const result of results) {
  console.log(`Command: ${result.command}`);
  console.log(`Status: ${result.status}`);
  console.log(
    `Replies captured: ${result.repliesCaptured ?? 0}`
  );

  if (result.error) {
    console.log(`Error: ${result.error}`);
  }

  console.log("------------------------------");
}

fs.writeFileSync(
  new URL("./test-results.json", import.meta.url),
  JSON.stringify(results, null, 2),
  "utf8"
);

console.log("\nResults saved to test-results.json");
console.log(
  "Note: COMPLETED means no error was thrown; it does not prove the command's answer is correct."
);
