import OpenAI from "openai";

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export const openAIModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/**
 * Model used for the per-turn live meeting dialogue. Each meeting fires many
 * sequential turn calls, so this should stay fast/cheap. Defaults to the same
 * cheap model the rest of the app uses.
 */
export const openAITurnModel =
  process.env.OPENAI_TURN_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/**
 * Model used for the single final verdict pass that reads the whole transcript
 * and grades emotional resonance. Defaults to the fast turn model so meetings
 * finish inside Vercel's 60s serverless cap; set OPENAI_VERDICT_MODEL=gpt-4o
 * for higher-quality reads when you have a longer maxDuration.
 */
export const openAIVerdictModel =
  process.env.OPENAI_VERDICT_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export const embeddingModel =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-large";
