import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { learner } from "../learner-store.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { safeAdminNotice } from "../shared.js";

registerMainMenuItem({ label: "Premium access", data: "premium:show", order: 50 });
const composer = new Composer<Ctx>();
composer.callbackQuery("premium:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (learner(ctx).premium_access) {
    await ctx.editMessageText("Premium access is active. You can keep using every lesson and practice flow.", { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
    return;
  }
  await ctx.editMessageText("Unlock premium chapter practice and detailed revision support with a one-time Telegram Stars purchase.", { reply_markup: inlineKeyboard([[inlineButton("Unlock for 99 Stars", "premium:buy")], [inlineButton("Back to menu", "menu:main")]]) });
});
composer.callbackQuery("premium:buy", async (ctx) => {
  await ctx.answerCallbackQuery();
  try {
    await ctx.replyWithInvoice("NEET AI Tutor Premium", "One-time premium study access", "neet-premium-once", "XTR", [{ label: "Premium access", amount: 99 }]);
  } catch {
    await ctx.reply("Payments aren’t available right now. Please try again a little later.");
  }
});
composer.on("pre_checkout_query", async (ctx) => {
  const query = ctx.preCheckoutQuery;
  if (query.invoice_payload !== "neet-premium-once") {
    await ctx.answerPreCheckoutQuery(false, { error_message: "That purchase could not be verified. Please try again from Premium access." });
    return;
  }
  await ctx.answerPreCheckoutQuery(true);
});
composer.on("message:successful_payment", async (ctx) => {
  if (ctx.message.successful_payment.invoice_payload !== "neet-premium-once") return;
  learner(ctx).premium_access = true;
  await ctx.reply("Premium access is active. Thank you for investing in your NEET preparation.", { reply_markup: inlineKeyboard([[inlineButton("Open study menu", "menu:main")]]) });
  await safeAdminNotice(ctx, "A learner has purchased NEET AI Tutor Premium.");
});
export default composer;
