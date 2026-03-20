import { InlineKeyboard, type Bot } from "grammy";
import { dockerService } from "../services/docker.js";
import { nextcloudService } from "../services/nextcloud.js";
import { craftyService } from "../services/crafty.js";
import { wireguardService } from "../services/wireguard.js";
import { diskService } from "../services/disk.js";
import type { Service } from "../services/index.js";

const services: Service[] = [
  dockerService,
  diskService,
  nextcloudService,
  craftyService,
  wireguardService,
];

export function registerCommands(bot: Bot): void {
  bot.command("status", async (ctx) => {
    const results = await Promise.allSettled(
      services.map((s) => s.getStatus())
    );

    const lines = results.map((result, i) => {
      const service = services[i]!;
      if (result.status === "fulfilled")
        return `*${service.name}*\n${result.value}`;
      return `*${service.name}*\nerror — ${result.reason}`;
    });

    await ctx.reply(lines.join("\n\n"), { parse_mode: "Markdown" });
  });

  bot.command("service", async (ctx) => {
    const keyboard = new InlineKeyboard();
    services.forEach((s) => keyboard.text(s.name, `service:${s.name}`).row());
    await ctx.reply("Choose a service:", { reply_markup: keyboard });
  });

  bot.callbackQuery(/^service:(.+)$/, async (ctx) => {
    const name = ctx.match[1];
    const service = services.find((s) => s.name === name);
    if (!service) return ctx.answerCallbackQuery("Service not found");

    const status = await service.getStatus().catch((e: Error) => `error — ${e.message}`);
    const actions = await service.getActions?.() ?? [];

    const keyboard = new InlineKeyboard();
    actions.forEach((a) =>
      keyboard.text(a.label, `action:${name}:${a.label}`).row()
    );
    keyboard.text("« Back", "back");

    await ctx.editMessageText(`*${name}*\n\n${status}`, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("back", async (ctx) => {
    const keyboard = new InlineKeyboard();
    services.forEach((s) => keyboard.text(s.name, `service:${s.name}`).row());
    await ctx.editMessageText("Choose a service:", { reply_markup: keyboard });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^action:(.+?):(.+)$/, async (ctx) => {
    const [, name, label] = ctx.match;
    const service = services.find((s) => s.name === name);
    const actions = await service?.getActions?.() ?? [];
    const action = actions.find((a) => a.label === label);
    if (!action) return ctx.answerCallbackQuery("Action not found");

    await ctx.answerCallbackQuery(`Running: ${label}…`);
    const result = await action.callback().catch((e: Error) => `error — ${e.message}`);
    await ctx.editMessageText(`*${name}* › ${label}\n\n${result}`, {
      parse_mode: "Markdown",
    });
  });
}
