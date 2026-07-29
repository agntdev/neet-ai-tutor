import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, mainMenuKeyboard } from "../toolkit/index.js";
import { eraseLearner, learner, type Language } from "../learner-store.js";
import { safeAdminNotice } from "../shared.js";

const composer = new Composer<Ctx>();

function languages() {
  return inlineKeyboard([
    [inlineButton("English", "onboard:lang:EN"), inlineButton("हिंदी", "onboard:lang:HIN")],
    [inlineButton("Hinglish", "onboard:lang:HG")],
  ]);
}

composer.command("start", async (ctx) => {
  const profile = learner(ctx);
  if (!profile.language) {
    ctx.session.step = "language";
    await ctx.reply("Welcome to NEET AI Tutor. Choose the language you’d like to learn in.", { reply_markup: languages() });
    return;
  }
  await ctx.reply("Your NEET study space is ready. Choose what you’d like to work on.", { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery(/^onboard:lang:(EN|HIN|HG)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const profile = learner(ctx);
  const firstSignup = !profile.language;
  profile.language = ctx.match[1] as Language;
  ctx.session.step = "consent";
  await ctx.editMessageText("Before we personalise your practice, may we save your progress and submitted doubts? Your study data stays private and you can delete it anytime.", {
    reply_markup: inlineKeyboard([[inlineButton("Allow and continue", "onboard:consent:yes"), inlineButton("Use without saving", "onboard:consent:no")]]),
  });
  if (firstSignup) await safeAdminNotice(ctx, "A new learner has joined NEET AI Tutor.");
});

composer.callbackQuery(/^onboard:consent:(yes|no)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const profile = learner(ctx);
  profile.consent = ctx.match[1] === "yes";
  ctx.session.step = "diagnostic";
  await ctx.editMessageText("Start with a short diagnostic to find the right chapter level, or begin learning now.", {
    reply_markup: inlineKeyboard([[inlineButton("Take diagnostic", "diag:start"), inlineButton("Open study menu", "menu:main")]]),
  });
});

composer.callbackQuery("diag:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "diagnostic";
  await ctx.editMessageText("Diagnostic question: Which cell organelle releases energy from food?", {
    reply_markup: inlineKeyboard([
      [inlineButton("Mitochondrion", "diag:answer:correct")],
      [inlineButton("Ribosome", "diag:answer:wrong")],
      [inlineButton("Open study menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery(/^diag:answer:(correct|wrong)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const correct = ctx.match[1] === "correct";
  ctx.session.step = "idle";
  await ctx.editMessageText(correct ? "Great start. Mitochondria release usable energy through respiration. Your study menu is ready." : "Good attempt. Mitochondria release usable energy through respiration. Your study menu is ready.", { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("privacy:delete", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Delete your saved progress, bookmarks, and doubt history? This can’t be undone.", { reply_markup: inlineKeyboard([[inlineButton("Delete my data", "privacy:confirm"), inlineButton("Keep my data", "progress:show")]]) });
});

composer.callbackQuery("privacy:confirm", async (ctx) => {
  await ctx.answerCallbackQuery();
  eraseLearner(ctx);
  ctx.session.step = "idle";
  await ctx.editMessageText("Your saved study data has been deleted. You can choose your preferences again whenever you start.", { reply_markup: languages() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "idle";
  ctx.session.flowExpiresAt = undefined;
  await ctx.editMessageText("Your NEET study space is ready. Choose what you’d like to work on.", { reply_markup: mainMenuKeyboard() });
});

export default composer;
