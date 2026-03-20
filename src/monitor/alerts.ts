import cron from "node-cron";
import type { Api } from "grammy";
import { checkSshFailures } from "./ssh.js";
import { checkNextcloudFailures } from "./nextcloud.js";
import { checkNpmFailures } from "./npm.js";
import { checkCraftyFailures } from "./crafty.js";

async function buildAlert(): Promise<string | null> {
  const [ssh, nc, npm, crafty] = await Promise.all([
    checkSshFailures(),
    checkNextcloudFailures(),
    checkNpmFailures(),
    checkCraftyFailures(),
  ]);

  const sections: string[] = [];

  if (ssh.length > 0) {
    const lines = ssh.map((f) => `• ${f.ip} → user \`${f.user}\` (${f.count}x)`);
    sections.push(`*SSH*\n${lines.join("\n")}`);
  }

  if (nc.length > 0) {
    const lines = nc.map((f) => `• ${f.ip} → user \`${f.user}\` (${f.count}x)`);
    sections.push(`*Nextcloud*\n${lines.join("\n")}`);
  }

  if (npm.length > 0) {
    const lines = npm.map((f) => `• ${f.ip} → ${f.path} ${f.status} (${f.count}x)`);
    sections.push(`*Nginx Proxy Manager*\n${lines.join("\n")}`);
  }

  if (crafty.length > 0) {
    const lines = crafty.map((f) => `• ${f.ip} (${f.count}x)`);
    sections.push(`*Crafty*\n${lines.join("\n")}`);
  }

  if (sections.length === 0) return null;

  return `⚠️ *Failed login attempts:*\n\n${sections.join("\n\n")}`;
}

export function startAlerts(api: Api, chatIds: number[]): void {
  cron.schedule("*/5 * * * *", async () => {
    const message = await buildAlert();
    if (!message) return;

    for (const chatId of chatIds) {
      await api.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }
  });
}