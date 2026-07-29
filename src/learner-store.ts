import type { Ctx } from "./bot.js";
import { now } from "./time.js";

export type Language = "EN" | "HIN" | "HG";
export type Subject = "Biology" | "Chemistry" | "Physics";

export interface Interaction {
  original_media: string;
  extracted_question: string;
  solution_steps: string[];
  timestamp: string;
}

export interface QuizAttempt {
  chapter: string;
  correct: boolean;
  timestamp: string;
}

export interface LearnerRecord {
  language?: Language;
  grade?: string;
  premium_access: boolean;
  preferred_subjects: Subject[];
  consent: boolean;
  bookmarks: string[];
  interactions: Interaction[];
  chapter_accuracy: Record<string, { correct: number; total: number }>;
  question_history: QuizAttempt[];
  weak_topics: string[];
  last_access: string;
}

function blank(): LearnerRecord {
  return {
    premium_access: false,
    preferred_subjects: [],
    consent: false,
    bookmarks: [],
    interactions: [],
    chapter_accuracy: {},
    question_history: [],
    weak_topics: [],
    last_access: now().toISOString(),
  };
}

/**
 * This record is stored through grammY's toolkit-selected persistent adapter:
 * Redis in the Node deployment and a Durable Object in Workers. It is scoped to
 * the active learner's chat, so no keyspace scan or cross-user in-memory store
 * is needed.
 */
export function learner(ctx: Ctx): LearnerRecord {
  if (!ctx.session.learner) ctx.session.learner = blank();
  const record = ctx.session.learner;
  // Uploaded-content metadata is retained only for the stated 180-day window.
  // The actual Telegram file is never copied to another service by this bot.
  const cutoff = now().getTime() - 180 * 24 * 60 * 60 * 1000;
  record.interactions = record.interactions.filter(
    (interaction) => Number.isFinite(Date.parse(interaction.timestamp)) && Date.parse(interaction.timestamp) >= cutoff,
  );
  record.last_access = now().toISOString();
  return record;
}

export function recordAttempt(ctx: Ctx, chapter: string, correct: boolean): LearnerRecord {
  const record = learner(ctx);
  const accuracy = record.chapter_accuracy[chapter] ?? { correct: 0, total: 0 };
  accuracy.total += 1;
  if (correct) accuracy.correct += 1;
  record.chapter_accuracy[chapter] = accuracy;
  record.question_history.push({ chapter, correct, timestamp: now().toISOString() });
  record.weak_topics = Object.entries(record.chapter_accuracy)
    .filter(([, value]) => value.total >= 1 && value.correct / value.total < 0.6)
    .map(([name]) => name);
  return record;
}

export function eraseLearner(ctx: Ctx): void {
  ctx.session.learner = blank();
}
