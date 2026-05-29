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
export const embeddingModel =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-large";
