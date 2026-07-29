import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { learner } from "../learner-store.js";
import { now } from "../time.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Ask a doubt", data: "doubt:submit", order: 10 });
const composer = new Composer<Ctx>();

function solve(question: string): { steps: string[]; diagram: string } {
  const lower = question.toLowerCase();
  if (lower.includes("ohm") || lower.includes("current") || lower.includes("voltage")) {
    return { steps: ["List the voltage, current, and resistance given in the question.", "Use Ohm’s law: V = IR.", "Rearrange only after checking the unit you need, then substitute the values."], diagram: "+ ──[ R ]── −\n      I →" };
  }
  if (lower.includes("mole") || lower.includes("molar") || lower.includes("mass")) {
    return { steps: ["Write the balanced chemical equation if a reaction is involved.", "Convert the given mass to moles using n = m ÷ M.", "Use the equation’s mole ratio, then convert to the requested unit."], diagram: "mass → moles → ratio → answer" };
  }
  if (lower.includes("cell") || lower.includes("mitochond") || lower.includes("organ")) {
    return { steps: ["Identify the cell structure named in the question.", "Recall its core function from the NCERT description.", "Match that function to the option or explanation before ruling out nearby terms."], diagram: "cell\n ├─ nucleus\n └─ mitochondrion → ATP" };
  }
  return { steps: ["Underline what is given and what you need to find.", "Choose the NEET concept or formula that links those two pieces.", "Work line by line, keeping units and signs consistent, then check the result against the question."], diagram: "given → concept → working → check" };
}

composer.callbackQuery("doubt:submit", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "doubt_media";
  ctx.session.flowExpiresAt = now().getTime() + 5 * 60 * 1000;
  await ctx.editMessageText("Send a clear photo, PDF, voice note, or type the question. Add a caption to a file if it needs context.", { reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]) });
});

composer.on(["message:photo", "message:document", "message:voice", "message:text"], async (ctx, next) => {
  if (ctx.session.step !== "doubt_media") return next();
  if (ctx.session.flowExpiresAt && now().getTime() > ctx.session.flowExpiresAt) {
    ctx.session.step = "idle";
    ctx.session.flowExpiresAt = undefined;
    await ctx.reply("Your doubt upload window has closed. Tap Ask a doubt when you’re ready to send it.");
    return;
  }
  const message = ctx.message;
  const document = "document" in message ? message.document : undefined;
  if (document && document.file_size && document.file_size > 20 * 1024 * 1024) {
    await ctx.reply("That file is too large to read here. Send a PDF or image under 20 MB, or type the question.");
    return;
  }
  if (document && document.mime_type && !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(document.mime_type)) {
    await ctx.reply("I couldn’t read that file type. Send a clear image or PDF, or type the question.");
    return;
  }
  const isVoice = "voice" in message && Boolean(message.voice);
  const rawQuestion = ("text" in message ? message.text : undefined) ?? message.caption;
  if (!rawQuestion || rawQuestion.trim().length < 3) {
    await ctx.reply(isVoice ? "I couldn’t turn that voice note into a question. Type the question or send a voice note with a short caption." : "I couldn’t find readable question text. Add a caption or type the question so I can guide you.");
    return;
  }
  const question = rawQuestion.trim().slice(0, 1500);
  const answer = solve(question);
  const profile = learner(ctx);
  const photo = "photo" in message ? message.photo : undefined;
  profile.interactions.push({ original_media: isVoice ? "voice" : document ? document.file_id : photo?.at(-1)?.file_id ?? "text", extracted_question: question, solution_steps: answer.steps, timestamp: now().toISOString() });
  ctx.session.step = "idle";
  ctx.session.flowExpiresAt = undefined;
  await ctx.reply(`Here’s a way to work through it:\n\n1. ${answer.steps[0]}\n2. ${answer.steps[1]}\n3. ${answer.steps[2]}\n\n${answer.diagram}`, { reply_markup: inlineKeyboard([[inlineButton("Ask another doubt", "doubt:submit"), inlineButton("Take a practice question", "mock:test")], [inlineButton("Back to menu", "menu:main")]]) });
});
export default composer;
