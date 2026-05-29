import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import type { GeneratedProxyProfile, ProxyRepresentative } from "@/lib/ai";
import { getPrisma, prisma } from "@/lib/prisma";

export const saveShadowSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(18).max(120).optional(),
  occupation: z.string().optional(),
  location: z.string().optional(),
  starSign: z.string().optional(),
  myersBriggs: z.string().optional(),
  profile: z.object({
    values: z.array(z.string()),
    traits: z.array(z.string()),
    goals: z.array(z.string()),
    communicationStyle: z.string(),
    humourStyle: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    relationshipPreferences: z.array(z.string()),
    summary: z.string()
  }),
  guidedAnswers: z.record(z.array(z.string())).default({}),
  llmImport: z.string().optional(),
  source: z.string().optional()
});

export type SaveShadowInput = z.infer<typeof saveShadowSchema>;

export async function getRequiredUserId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }

  return userId;
}

function answerText(
  answers: Record<string, string[]>,
  key: string,
  fallback: string
) {
  return answers[key]?.join(", ") || fallback;
}

export function databaseReady() {
  return Boolean(prisma);
}

export async function saveUserShadow(userId: string, input: SaveShadowInput) {
  const db = getPrisma();
  const profile = input.profile;
  const guidedAnswers = input.guidedAnswers;

  return db.proxy.upsert({
    where: { userId },
    create: {
      userId,
      displayName: input.name,
      age: input.age,
      occupation: input.occupation,
      location: input.location,
      motivation: answerText(guidedAnswers, "motivation", "Not provided yet."),
      frustrations: answerText(guidedAnswers, "frustrations", "Not provided yet."),
      goals: answerText(guidedAnswers, "goals", "Not provided yet."),
      lookingFor: answerText(guidedAnswers, "lookingFor", "Not provided yet."),
      greatRelationship: answerText(
        guidedAnswers,
        "greatRelationship",
        "Not provided yet."
      ),
      values: profile.values,
      traits: profile.traits,
      generatedProfile: profile,
      communicationStyle: profile.communicationStyle,
      humourStyle: profile.humourStyle,
      strengths: profile.strengths,
      weaknesses: profile.weaknesses,
      relationshipPreferences: profile.relationshipPreferences,
      summary: profile.summary,
      embeddingStatus: input.source ?? "openai",
      imports: input.llmImport?.trim()
        ? {
            create: {
              type: "CHATGPT_EXPORT",
              source: "LLM Import",
              rawText: input.llmImport.trim()
            }
          }
        : undefined
    },
    update: {
      displayName: input.name,
      age: input.age,
      occupation: input.occupation,
      location: input.location,
      motivation: answerText(guidedAnswers, "motivation", "Not provided yet."),
      frustrations: answerText(guidedAnswers, "frustrations", "Not provided yet."),
      goals: answerText(guidedAnswers, "goals", "Not provided yet."),
      lookingFor: answerText(guidedAnswers, "lookingFor", "Not provided yet."),
      greatRelationship: answerText(
        guidedAnswers,
        "greatRelationship",
        "Not provided yet."
      ),
      values: profile.values,
      traits: profile.traits,
      generatedProfile: profile,
      communicationStyle: profile.communicationStyle,
      humourStyle: profile.humourStyle,
      strengths: profile.strengths,
      weaknesses: profile.weaknesses,
      relationshipPreferences: profile.relationshipPreferences,
      summary: profile.summary,
      embeddingStatus: input.source ?? "openai"
    }
  });
}

export function proxyToRepresentative(proxy: {
  displayName: string;
  age: number | null;
  occupation: string | null;
  location: string | null;
  values: unknown;
  traits: unknown;
  generatedProfile: unknown;
  communicationStyle: string;
  humourStyle: string;
  strengths: unknown;
  weaknesses: unknown;
  relationshipPreferences: unknown;
  summary: string;
}): ProxyRepresentative {
  const generatedProfile = proxy.generatedProfile as Partial<GeneratedProxyProfile>;

  return {
    name: proxy.displayName,
    age: proxy.age ?? undefined,
    occupation: proxy.occupation ?? undefined,
    location: proxy.location ?? undefined,
    values: generatedProfile.values ?? (proxy.values as string[]),
    traits: generatedProfile.traits ?? (proxy.traits as string[]),
    goals: generatedProfile.goals ?? [],
    communicationStyle:
      generatedProfile.communicationStyle ?? proxy.communicationStyle,
    humourStyle: generatedProfile.humourStyle ?? proxy.humourStyle,
    strengths: generatedProfile.strengths ?? (proxy.strengths as string[]),
    weaknesses: generatedProfile.weaknesses ?? (proxy.weaknesses as string[]),
    relationshipPreferences:
      generatedProfile.relationshipPreferences ??
      (proxy.relationshipPreferences as string[]),
    summary: generatedProfile.summary ?? proxy.summary
  };
}
