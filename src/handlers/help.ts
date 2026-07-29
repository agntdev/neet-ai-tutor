import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();
const help = "Use the buttons to learn a chapter, ask a doubt, take a mock test, or check your progress. Send a photo, PDF, voice note, or typed question when you’re asked for a doubt.";
const back = inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]);
composer.command("help", async (ctx) => { await ctx.reply(help, { reply_markup: back }); });
composer.callbackQuery("menu:help", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText(help, { reply_markup: back }); });
export default composer;
