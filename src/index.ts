import { Bot } from "grammy";
import { registerCommands } from "./bot/commands.js";

const BOT_TOKEN = process.env.BOT_TOKEN!;
const ALLOWED_IDS = (process.env.ALLOWED_IDS ?? "")
  .split(",")
  .map((id) => Number(id.trim()));

const bot = new Bot(BOT_TOKEN);

// Whitelist middleware
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId || !ALLOWED_IDS.includes(userId)) {
    await ctx.reply("Access denied.");
    return;
  }
  await next();
});

bot.command("start", (ctx) => ctx.reply("Homelab bot is running."));
registerCommands(bot);

bot.start();
console.log("Bot started.");
