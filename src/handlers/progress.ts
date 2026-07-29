import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { learner } from "../learner-store.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "My progress", data: "progress:show", order: 40 });
const composer = new Composer<Ctx>();
composer.callbackQuery("progress:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const profile = learner(ctx);
  const rows = Object.entries(profile.chapter_accuracy);
  if (rows.length === 0) {
    await ctx.editMessageText("No quiz results yet — take a mock test to start your progress report.", { reply_markup: inlineKeyboard([[inlineButton("Take mock test", "mock:test")], [inlineButton("Back to menu", "menu:main")]]) });
    return;
  }
  const summary = rows.map(([chapter, score]) => `${chapter}: ${score.correct}/${score.total}`).join("\n");
  const weak = profile.weak_topics.length ? `Focus next on: ${profile.weak_topics.join(", ")}.` : "You’re building a steady foundation across the chapters you’ve practised.";
  await ctx.editMessageText(`Your learning report\n\n${summary}\n\n${weak}\n\nCome back each week to compare your chapter scores.`, { reply_markup: inlineKeyboard([[inlineButton("Take mock test", "mock:test"), inlineButton("Manage privacy", "privacy:delete")], [inlineButton("Back to menu", "menu:main")]]) });
});
export default composer;
