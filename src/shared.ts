import type { Ctx } from "./bot.js";
import { inlineButton, inlineKeyboard } from "./toolkit/index.js";

export const backMenu = inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]);

export async function safeAdminNotice(ctx: Ctx, text: string): Promise<void> {
  const raw = typeof process === "undefined" ? undefined : process.env.ADMIN_CHAT_ID;
  if (!raw || !/^-?\d+$/.test(raw)) return;
  try {
    await ctx.api.sendMessage(raw, text);
  } catch {
    // An administrator may block the bot; a notification must not break learning.
  }
}
