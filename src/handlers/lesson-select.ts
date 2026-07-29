import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { learner } from "../learner-store.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { backMenu } from "../shared.js";

registerMainMenuItem({ label: "Chapter lessons", data: "lesson:select", order: 20 });
const composer = new Composer<Ctx>();

const chapters = {
  Biology: [["Cell: The Unit of Life", "lesson:bio:cell"], ["Human Physiology", "lesson:bio:phys"]],
  Chemistry: [["Chemical Bonding", "lesson:chem:bond"], ["Mole Concept", "lesson:chem:mole"]],
  Physics: [["Motion in a Straight Line", "lesson:phy:motion"], ["Current Electricity", "lesson:phy:current"]],
} as const;

function chapterMenu(subject: keyof typeof chapters) {
  return inlineKeyboard([...chapters[subject].map(([name, data]) => [inlineButton(name, data)]), [inlineButton("Back to subjects", "lesson:select")], [inlineButton("Back to menu", "menu:main")]]);
}

const content: Record<string, { title: string; concept: string; reference: string; difficulty: string }> = {
  "bio:cell": { title: "Cell: The Unit of Life", concept: "Cells are the structural and functional units of life. Compare prokaryotic cells, which lack a membrane-bound nucleus, with eukaryotic cells, which have one.", reference: "NCERT Biology Class 11, Chapter 8", difficulty: "Foundation" },
  "bio:phys": { title: "Human Physiology", concept: "Homeostasis keeps the internal environment stable. Link each organ system to the variable it regulates before memorising details.", reference: "NCERT Biology Class 11, Chapters 16–22", difficulty: "Core" },
  "chem:bond": { title: "Chemical Bonding", concept: "A bond forms when the combined arrangement is more stable. Use valence electrons and electronegativity difference to predict ionic or covalent character.", reference: "NCERT Chemistry Class 11, Chapter 4", difficulty: "Core" },
  "chem:mole": { title: "Mole Concept", concept: "One mole contains 6.022 × 10²³ entities. Convert given mass to moles first, then use the balanced equation ratio.", reference: "NCERT Chemistry Class 11, Chapter 1", difficulty: "Foundation" },
  "phy:motion": { title: "Motion in a Straight Line", concept: "Choose a positive direction, then keep signs consistent. The slope of a position–time graph is velocity; the slope of a velocity–time graph is acceleration.", reference: "NCERT Physics Class 11, Chapter 3", difficulty: "Foundation" },
  "phy:current": { title: "Current Electricity", concept: "Current is charge per unit time. For an ohmic conductor at constant temperature, use V = IR and check whether units agree.", reference: "NCERT Physics Class 12, Chapter 3", difficulty: "Core" },
};

composer.callbackQuery("lesson:select", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Choose a subject to open an NCERT-aligned chapter.", { reply_markup: inlineKeyboard([[inlineButton("Biology", "lesson:subject:Biology"), inlineButton("Chemistry", "lesson:subject:Chemistry")], [inlineButton("Physics", "lesson:subject:Physics")], [inlineButton("Back to menu", "menu:main")]]) });
});
composer.callbackQuery(/^lesson:subject:(Biology|Chemistry|Physics)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const subject = ctx.match[1] as keyof typeof chapters;
  await ctx.editMessageText(`Choose a ${subject} chapter.`, { reply_markup: chapterMenu(subject) });
});
composer.callbackQuery(/^lesson:(bio|chem|phy):(cell|phys|bond|mole|motion|current)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const id = `${ctx.match[1]}:${ctx.match[2]}`;
  const lesson = content[id];
  if (!lesson) return;
  await ctx.editMessageText(`${lesson.title}\n\n${lesson.concept}\n\n${lesson.reference} · ${lesson.difficulty} level`, { reply_markup: inlineKeyboard([[inlineButton("Save bookmark", `bookmark:${id}`), inlineButton("Take a question", "mock:test")], [inlineButton("Back to lessons", "lesson:select")]]) });
});
composer.callbackQuery(/^bookmark:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery({ text: "Bookmark saved" });
  const id = ctx.match[1];
  const profile = learner(ctx);
  if (!profile.bookmarks.includes(id)) profile.bookmarks.push(id);
  await ctx.editMessageText("This lesson is saved in your progress area. Return whenever you want a quick revision.", { reply_markup: backMenu });
});
export default composer;
