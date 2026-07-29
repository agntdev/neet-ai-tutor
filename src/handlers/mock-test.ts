import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { learner, recordAttempt } from "../learner-store.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Take mock test", data: "mock:test", order: 30 });
const composer = new Composer<Ctx>();

interface Question { chapter: string; text: string; choices: [string, string, string, string]; correct: number; reason: string; ncert: string; }
const questions: Record<string, Question> = {
  Biology: { chapter: "Cell: The Unit of Life", text: "Which organelle is the main site of aerobic respiration?", choices: ["Ribosome", "Mitochondrion", "Golgi apparatus", "Lysosome"], correct: 1, reason: "Mitochondria contain enzymes for aerobic respiration and produce most cellular ATP.", ncert: "NCERT Biology Class 11, Chapter 8" },
  Chemistry: { chapter: "Mole Concept", text: "How many moles are present in 18 g of water (H₂O)?", choices: ["0.5 mol", "1 mol", "18 mol", "36 mol"], correct: 1, reason: "Molar mass of water is 18 g mol⁻¹, so moles = mass ÷ molar mass = 18 ÷ 18 = 1.", ncert: "NCERT Chemistry Class 11, Chapter 1" },
  Physics: { chapter: "Motion in a Straight Line", text: "The slope of a velocity–time graph gives:", choices: ["Displacement", "Acceleration", "Speed", "Force"], correct: 1, reason: "Acceleration is the rate of change of velocity with time, which is the slope of a velocity–time graph.", ncert: "NCERT Physics Class 11, Chapter 3" },
};

composer.callbackQuery("mock:test", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Choose a subject for a chapterwise PYQ-style question.", { reply_markup: inlineKeyboard([[inlineButton("Biology", "quiz:subject:Biology"), inlineButton("Chemistry", "quiz:subject:Chemistry")], [inlineButton("Physics", "quiz:subject:Physics")], [inlineButton("Back to menu", "menu:main")]]) });
});
composer.callbackQuery(/^quiz:subject:(Biology|Chemistry|Physics)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const subject = ctx.match[1];
  const q = questions[subject];
  await ctx.editMessageText(`${q.chapter}\n\n${q.text}`, { reply_markup: inlineKeyboard(q.choices.map((choice, index) => [inlineButton(choice, `quiz:mcq:${subject}:${index}`)])) });
});
composer.callbackQuery(/^quiz:mcq:(Biology|Chemistry|Physics):(\d)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const subject = ctx.match[1];
  const selected = Number(ctx.match[2]);
  const q = questions[subject];
  const correct = selected === q.correct;
  const profile = recordAttempt(ctx, q.chapter, correct);
  const score = profile.chapter_accuracy[q.chapter];
  await ctx.editMessageText(`${correct ? "Correct — well done." : `Not quite. The correct answer is ${q.choices[q.correct]}.`}\n\nWhy: ${q.reason}\n\nTested concept: ${q.chapter}\n${q.ncert}\n\nYour chapter score: ${score.correct}/${score.total}`, { reply_markup: inlineKeyboard([[inlineButton("Next question", "mock:test"), inlineButton("View progress", "progress:show")], [inlineButton("Back to menu", "menu:main")]]) });
});
export default composer;
