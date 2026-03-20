import type { Bot } from "grammy";
import { dockerService } from "../services/docker.js";
import type { Service } from "../services/index.js";

const services: Service[] = [dockerService];

export function registerCommands(bot: Bot): void {
  bot.command("status", async (ctx) => {
    const results = await Promise.allSettled(
      services.map((s) => s.getStatus())
    );

    const lines = results.map((result, i) => {
      const service = services[i]!;
      if (result.status === "fulfilled") return result.value;
      return `${service.name}: error — ${result.reason}`;
    });

    await ctx.reply(lines.join("\n\n"));
  });
}
