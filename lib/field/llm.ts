// LLM layer for the Shadow-to-Shadow conversation engine.
//
// The deterministic engine (./engine) remains the source of truth for the
// protocol: stages, scoring, privacy decisions, memory and the recommendation.
// This layer asks an LLM to turn each stage's structured skeleton into natural
// agent-to-agent dialogue — two Shadows actually talking — while:
//
//   • only ever seeing a SHAREABLE projection of each profile
//     (never raw sourceNotes or doNotDisclose material),
//   • being validated against a strict JSON schema,
//   • being scanned for any do-not-disclose leakage, and
//   • falling back to the deterministic exchange on any key/parse/privacy issue.
//
// So the conversation is genuinely AI-generated, but privacy, scoring and the
// final report stay owned by code.

import { z } from "zod";

import { getOpenAI, openAIModel } from "../openai.ts";

import {
  generateMeetingAgenda,
  runShadowMeeting,
  type ShadowMeetingRun
} from "./engine.ts";
import {
  STAGE_LABELS,
  type EvidenceType,
  type ExchangeIntent,
  type ExchangeMessage,
  type MeetingMemory,
  type MeetingStage,
  type PrivacyLevel,
  type ShadowProfile,
  type StructuredMeetingResult
} from "./types.ts";

export interface ShadowMeetingRunAI extends ShadowMeetingRun {
  source: "openai" | "demo";
}

export const STAGE_PURPOSE: Record<MeetingStage, string> = {
  surface:
    "Clear the prerequisites only: is this even plausible — intent, basics, and any hard dealbreakers. Surface similarity (shared hobbies/interests) is NOT the point and should not be treated as compatibility.",
  values_rhythm:
    "The core of the due diligence: work out how these two affect each other emotionally. Does the other person regulate, energise, soothe, challenge or destabilise mine? Are their differences attractive and complementary, or quietly irritating? This is emotional resonance, not a checklist of things in common.",
  friction_test:
    "Pressure-test the resonance: when it gets awkward or tense, does the conversation recover, or does it stall? Name the most likely future tension and whether repair feels possible.",
  logistics:
    "Make a recommendation practical: agree a convenient meeting zone and first-date format. Light context only — never the basis of the verdict.",
  handoff:
    "Close out: is there curiosity left over, would my person want to keep spending time with theirs even through silences, and what remains emotionally once it ends?"
};

const turnSchema = z.object({
  speaker: z.enum(["A", "B"]),
  intent: z.enum(["CLAIM", "QUESTION", "EVIDENCE", "CONCERN", "RESOLUTION", "FOLLOW_UP"]),
  content: z.string().min(1)
});
const stageDialogueSchema = z.object({
  turns: z.array(turnSchema).min(2).max(8)
});

/** Only the fields a counterpart Shadow is allowed to reason over. */
export function shareableView(p: ShadowProfile) {
  return {
    name: p.displayName ?? "their person",
    age: p.age,
    area: p.homeArea ?? p.locationArea,
    workArea: p.workArea,
    relationshipIntent: p.relationshipIntent,
    values: p.values,
    personalityTraits: p.personalityTraits,
    communicationStyle: p.communicationStyle,
    humourStyle: p.humourStyle,
    ambitionGoals: p.ambitionGoals,
    lifestylePreferences: p.lifestylePreferences,
    // High-level emotional needs are shareable; the raw history behind them is not.
    emotionalNeeds: p.emotionalNeeds,
    conflictStyle: p.conflictStyle,
    familyChildrenViews: p.familyChildrenViews,
    greenFlags: p.greenFlags,
    nonNegotiables: p.nonNegotiables,
    lookingFor: p.lookingFor,
    approvedFacts: p.shareableFacts
  };
}

export function intentPrivacy(intent: ExchangeIntent): PrivacyLevel {
  return intent === "CLAIM" || intent === "EVIDENCE" ? "shareable" : "public";
}

export function intentEvidence(intent: ExchangeIntent, stage: MeetingStage): EvidenceType {
  if (stage === "logistics") return "logistics";
  if (intent === "EVIDENCE") return "pattern";
  if (intent === "CLAIM") return "profile";
  return "inference";
}

export function disclosureTokens(...profiles: ShadowProfile[]): string[] {
  return profiles
    .flatMap((p) => p.doNotDisclose ?? [])
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export function leaksPrivateData(text: string, tokens: string[]): boolean {
  const lower = text.toLowerCase();
  return tokens.some((t) => lower.includes(t));
}

async function narrateStage(
  client: ReturnType<typeof getOpenAI>,
  a: ShadowProfile,
  b: ShadowProfile,
  skeleton: StructuredMeetingResult,
  prevMemoryRecap?: string
): Promise<ExchangeMessage[]> {
  // No skeleton turns (e.g. nothing to say) → nothing to narrate.
  if (!client || skeleton.exchange.length === 0) return skeleton.exchange;

  const stage = skeleton.stage;
  const agenda = generateMeetingAgenda(a, b, stage);
  const tokens = disclosureTokens(a, b);
  const labelA = `${a.displayName ?? "A"}'s Shadow`;
  const labelB = `${b.displayName ?? "B"}'s Shadow`;

  try {
    const response = await client.chat.completions.create({
      model: openAIModel,
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: [
            "You are writing a real, natural conversation between two people's AI representatives (their 'Shadows') on a matchmaking platform. Speaker A represents the first person; speaker B represents the second.",
            "They are performing emotional-compatibility DUE DILIGENCE on each other's humans — not flirting, not selling, not dating. Think two perceptive, emotionally intelligent friends quietly working out whether these two people would actually be good for each other.",
            "Shadow's whole thesis: ordinary dating apps match on surface similarity (same hobbies, same taste). You do NOT. You measure emotional RESONANCE — how the two people affect each other. So steer the conversation toward questions like: how does this person make my person FEEL; do they regulate, energise, soothe, challenge or destabilise them; are their differences attractive and complementary or quietly irritating; when it got awkward, did the conversation recover; is there curiosity left over; would my person want to keep spending time with yours even through the silences; what's left emotionally once it ends. Treat shared hobbies/interests as light colour only, never as the reason two people fit.",
            "MOST IMPORTANT: make it sound like a genuine spoken conversation. They address each other directly and react to what was just said — e.g. 'Yeah, mine's similar, but…', 'Can I ask how yours handles…?', 'Honestly, that's where I'd worry.', 'Right, that tracks.' They interrupt the rhythm: some short lines, some longer. They agree, gently push back, ask real follow-ups, and build on each other's points. NEVER make every line a self-contained announcement, and never start consecutive lines with 'My person…'.",
            "Refer to the humans in the third person as 'my person', 'yours', or by first name if provided. Never role-play as the humans themselves and never speak in the first person AS the human.",
            "CRUCIAL ROLE RULE: each Shadow already knows its OWN person completely and speaks/answers FOR them. A Shadow must NEVER ask a question about its own person (e.g. A's Shadow must never ask whether A wants something serious — it already knows and simply states it). Questions are ALWAYS directed at the OTHER Shadow about the OTHER person. In the payload, `aShadowAsksAboutB` are things A's Shadow wants to learn about B, so only speaker A may voice them; `bShadowAsksAboutA` are things B's Shadow wants to learn about A, so only speaker B may voice them.",
            "Hard privacy rule: only use the information in the shareable views. Never invent private history, exes, health, substances or trauma. Keep anything sensitive high-level (e.g. 'needs steadiness once it gets serious').",
            "Each turn has an underlying intent (CLAIM, QUESTION, EVIDENCE, CONCERN, RESOLUTION, FOLLOW_UP) — but treat that only as the purpose of the line. The wording must stay conversational and human; never name or label the intent in the text.",
            "Naturally arrive at the conclusions the engine already reached (the provided alignment, friction and any first-date idea), as if the two Shadows worked them out together in the chat — and frame those conclusions in terms of emotional effect (how they'd feel around each other), not shared interests. Do not contradict them.",
            "Keep the tone intelligent, private and perceptive throughout.",
            "PUNCTUATION RULE (strict): never use em dashes or en dashes in any text you write. Use commas, periods, or regular hyphens instead. This applies to every string you output.",
            "Return strict JSON: { \"turns\": [ { \"speaker\": \"A\"|\"B\", \"intent\": <one of the intents>, \"content\": string } ] } with 4-6 turns that alternate speakers and read as one continuous, flowing conversation."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            stage: STAGE_LABELS[stage],
            stagePurpose: STAGE_PURPOSE[stage],
            followUpRecap: prevMemoryRecap ?? null,
            agendaTopics: agenda.topics,
            // Attribution matters: a question ABOUT A must be asked BY B's Shadow
            // (and vice-versa). A Shadow never interrogates its own person.
            aShadowAsksAboutB: agenda.questionsForB,
            bShadowAsksAboutA: agenda.questionsForA,
            shareableViewA: shareableView(a),
            shareableViewB: shareableView(b),
            conclusionsToConvey: {
              alignment: skeleton.alignment,
              friction: skeleton.friction,
              factsAboutA: skeleton.factsAboutA,
              factsAboutB: skeleton.factsAboutB,
              firstDateSuggestion: skeleton.firstDateSuggestion ?? null
            }
          })
        }
      ]
    });

    const raw = response.choices[0]?.message.content;
    if (!raw) return skeleton.exchange;

    const parsed = stageDialogueSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return skeleton.exchange;

    const messages: ExchangeMessage[] = parsed.data.turns.map((turn) => ({
      stage,
      speaker: turn.speaker === "A" ? a.userId : b.userId,
      speakerLabel: turn.speaker === "A" ? labelA : labelB,
      intent: turn.intent as ExchangeIntent,
      content: turn.content.trim(),
      evidenceType: intentEvidence(turn.intent as ExchangeIntent, stage),
      privacyLevel: intentPrivacy(turn.intent as ExchangeIntent),
      extractedFacts: []
    }));

    // Privacy guard: if the model leaked any protected term, discard its output
    // for this stage and use the deterministic (already-safe) exchange.
    if (messages.some((m) => leaksPrivateData(m.content, tokens))) {
      return skeleton.exchange;
    }

    return messages;
  } catch {
    return skeleton.exchange;
  }
}

/**
 * Run a full Shadow meeting and have an LLM voice the agent-to-agent dialogue.
 * Scoring, memory, privacy decisions and the report stay deterministic.
 */
export async function runShadowMeetingAI(
  a: ShadowProfile,
  b: ShadowProfile,
  options?: {
    stages?: MeetingStage[];
    prevMemory?: MeetingMemory;
    meetingId?: string;
    now?: Date;
  }
): Promise<ShadowMeetingRunAI> {
  const run = runShadowMeeting(a, b, options);
  const client = getOpenAI();

  if (!client) {
    return { ...run, source: "demo" };
  }

  // On a follow-up, the deterministic engine puts the "Last time we established…"
  // recap as the opening RESOLUTION turn — pass it through so the LLM continues
  // from it rather than re-introducing.
  const recap = options?.prevMemory
    ? run.stageResults[0]?.exchange.find((m) => m.intent === "RESOLUTION")?.content
    : undefined;
  const narrated = await Promise.all(
    run.stageResults.map(async (stageResult, index) => ({
      ...stageResult,
      exchange: await narrateStage(
        client,
        a,
        b,
        stageResult,
        index === 0 ? recap : undefined
      )
    }))
  );

  return { ...run, stageResults: narrated, source: "openai" };
}
