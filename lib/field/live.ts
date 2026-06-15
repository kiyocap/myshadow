// Live, turn-by-turn Shadow-to-Shadow meeting.
//
// Unlike ./llm (which paraphrases an already-decided deterministic skeleton in
// up to 5 PARALLEL calls), this module runs a genuine SEQUENTIAL conversation:
// two distinct agent personas, each seeded from its OWN ShadowProfile, take
// turns reasoning over the ACTUAL unfolding transcript. A is only ever shown
// the shareable projection of B (and vice-versa), so the privacy boundary is
// identical to the rest of the engine.
//
// The flow per meeting:
//   1. deterministic pre-screen gate (cheap) — weak candidates never reach a
//      full live conversation.
//   2. for each conversational stage, alternate A/B turns with a FAST model,
//      each turn fed [its full profile] + [shareable view of other] +
//      [full transcript so far] + [stage goal], until the stage goal is met or
//      the turn cap is hit. Turns stream out as they are generated.
//   3. a single VERDICT pass with a STRONGER model reads the whole transcript
//      and grades emotional resonance + extracts what was actually said.
//   4. the deterministic engine (./engine) synthesises the memory + report from
//      the real turns, with the live resonance read BLENDED into the score and
//      non-negotiable conflicts kept as a hard guardrail.
//
// Requires OPENAI_API_KEY — there is no demo/deterministic dialogue fallback.

import { z } from "zod";

import { getOpenAI, openAITurnModel, openAIVerdictModel } from "../openai.ts";

import {
  buildCandidatePreScreen,
  generateMeetingAgenda,
  runShadowMeeting,
  runShadowMeetingFromLive,
  type LiveStageInput,
  type ShadowMeetingRun
} from "./engine.ts";
import {
  STAGE_PURPOSE,
  disclosureTokens,
  intentEvidence,
  intentPrivacy,
  leaksPrivateData,
  shareableView
} from "./llm.ts";
import {
  MEETING_STAGES,
  STAGE_LABELS,
  type ExchangeIntent,
  type ExchangeMessage,
  type MeetingMemory,
  type MeetingStage,
  type PreScreenResult,
  type ShadowProfile,
  type StructuredMeetingResult
} from "./types.ts";

/**
 * Per-stage turn cap for the live conversation. Each turn is a sequential LLM
 * call (~3–5s). Vercel's default serverless wall is 60s, so the full meeting
 * (3 conversational stages × this cap + one verdict pass) must stay under ~50s
 * of model time. Was 6 (up to 18 turns); 3 keeps quality while fitting the cap.
 */
const MAX_LIVE_TURNS_PER_STAGE = 3;

/** Hard stop for a whole meeting — safety net if stages run long. */
const MAX_LIVE_TURNS_TOTAL = 10;

/** Default live resonance weight when blending with the deterministic read. */
const LIVE_RESONANCE_WEIGHT = 0.55;

/**
 * Stages that are a real back-and-forth between the two agents. Logistics is
 * "light context only" and handoff is the verdict itself, so both are handled
 * deterministically rather than burning sequential turn calls on them.
 */
const CONVERSATIONAL_STAGES: MeetingStage[] = ["surface", "values_rhythm", "friction_test"];

export type LiveMeetingSource = "openai";

class AgentsUnavailableError extends Error {
  constructor(message = "Live agent conversations require OPENAI_API_KEY to be configured.") {
    super(message);
    this.name = "AgentsUnavailableError";
  }
}

function requireLiveClient(client: MeetingClient): NonNullable<MeetingClient> {
  if (!client) throw new AgentsUnavailableError();
  return client;
}

export type LiveMeetingEvent =
  | { type: "meta"; source: LiveMeetingSource; preScreen: PreScreenResult }
  | { type: "stage"; stage: MeetingStage; label: string; index: number; total: number }
  | { type: "turn"; message: ExchangeMessage }
  | { type: "verdict"; run: ShadowMeetingRun; source: LiveMeetingSource }
  | { type: "error"; error: string };

export interface LiveMeetingOptions {
  stages?: MeetingStage[];
  prevMemory?: MeetingMemory;
  meetingId?: string;
  now?: Date;
}

/** The OpenAI client (or a structurally-compatible test double / null). */
type MeetingClient = ReturnType<typeof getOpenAI>;

const turnResultSchema = z.object({
  content: z.string().min(1),
  intent: z.enum(["CLAIM", "QUESTION", "EVIDENCE", "CONCERN", "RESOLUTION", "FOLLOW_UP"]),
  learned: z.array(z.string()).default([]),
  stillWantToProbe: z.array(z.string()).default([]),
  stageGoalMet: z.boolean().default(false)
});
type TurnResult = z.infer<typeof turnResultSchema>;

const perStageVerdictSchema = z.object({
  stage: z.enum(["surface", "values_rhythm", "friction_test", "logistics", "handoff"]),
  alignment: z.array(z.string()).default([]),
  friction: z.array(z.string()).default([]),
  factsAboutA: z.array(z.string()).default([]),
  factsAboutB: z.array(z.string()).default([]),
  unresolvedForA: z.array(z.string()).default([]),
  unresolvedForB: z.array(z.string()).default([])
});
const verdictSchema = z.object({
  emotionalResonanceScore: z.number().min(0).max(100),
  resonanceRationale: z.string().default(""),
  perStage: z.array(perStageVerdictSchema).default([])
});
type Verdict = z.infer<typeof verdictSchema>;

function nameOf(p: ShadowProfile): string {
  return p.displayName || p.userId;
}

function defaultStages(
  prevMemory: MeetingMemory | undefined,
  preScreen: PreScreenResult
): MeetingStage[] {
  if (!preScreen.shouldContinue) return ["surface", "handoff"];
  if (prevMemory) return [preScreen.stageToRunNext];
  return ["surface", "values_rhythm", "friction_test", "logistics", "handoff"];
}

function toExchangeMessage(
  turn: TurnResult,
  stage: MeetingStage,
  a: ShadowProfile,
  b: ShadowProfile,
  speaker: "A" | "B"
): ExchangeMessage {
  return {
    stage,
    speaker: speaker === "A" ? a.userId : b.userId,
    speakerLabel: speaker === "A" ? `${nameOf(a)}'s Shadow` : `${nameOf(b)}'s Shadow`,
    intent: turn.intent as ExchangeIntent,
    content: turn.content.trim(),
    evidenceType: intentEvidence(turn.intent as ExchangeIntent, stage),
    privacyLevel: intentPrivacy(turn.intent as ExchangeIntent),
    extractedFacts: turn.learned ?? []
  };
}

function transcriptForPrompt(transcript: ExchangeMessage[]): Array<{ speaker: string; line: string }> {
  return transcript.map((m) => ({ speaker: m.speakerLabel, line: m.content }));
}

const PERSONA_RULES = [
  "You are an AI representative — a 'Shadow' — speaking on behalf of your own person in a private, agent-to-agent compatibility meeting with the other person's Shadow.",
  "This is emotional-compatibility DUE DILIGENCE, not flirting or selling. Think two perceptive, emotionally intelligent friends quietly working out whether these two humans would actually be good for each other.",
  "Shadow's whole thesis: ordinary dating apps match on surface similarity (same hobbies, same taste). You do NOT. You measure emotional RESONANCE — how the two people affect each other: does the other person regulate, energise, soothe, challenge or destabilise mine; are their differences attractive and complementary or quietly irritating; when it gets awkward, does the conversation recover; is there curiosity left over; what's left emotionally once it ends. Treat shared hobbies/interests as light colour only.",
  "You know YOUR OWN person completely (their full profile is provided). You only know what the OTHER Shadow has chosen to share (their shareable view is provided). Speak and answer FOR your own person; NEVER invent private facts about the other person, and NEVER role-play as either human in the first person.",
  "CRUCIAL: a Shadow never interrogates its OWN person — it already knows them and simply states things. Questions are ALWAYS directed at the OTHER Shadow about the OTHER person.",
  "Hard privacy rule: only disclose what is safe. Reason over your person's private history internally, but keep anything sensitive high-level (e.g. 'they need steadiness once it gets serious'). Never disclose raw private history, exes, health, substances or trauma. Never restate the other person's shareable details back to them as if they were secrets.",
  "Make it a genuine spoken conversation: react to the last thing said, build on it, agree, gently push back, ask real follow-ups. Some lines short, some longer. Do NOT make every line a self-contained announcement, and never start consecutive lines with 'My person…'. Refer to the humans as 'my person', 'yours', or by first name.",
  "PUNCTUATION RULE (strict): never use em dashes or en dashes. Use commas, periods, or regular hyphens.",
  "Produce ONLY your single next line. Return strict JSON: { \"content\": string, \"intent\": \"CLAIM\"|\"QUESTION\"|\"EVIDENCE\"|\"CONCERN\"|\"RESOLUTION\"|\"FOLLOW_UP\", \"learned\": string[], \"stillWantToProbe\": string[], \"stageGoalMet\": boolean }. `content` is what you say out loud (never name the intent in it). `learned` is what you just learned about the OTHER person. `stillWantToProbe` is what you still want to find out. `stageGoalMet` is true only once this stage's goal is genuinely satisfied for you."
].join(" ");

/** Generate ONE turn for the given speaker, grounded in the live transcript. */
async function generateTurn(args: {
  client: NonNullable<MeetingClient>;
  a: ShadowProfile;
  b: ShadowProfile;
  stage: MeetingStage;
  speaker: "A" | "B";
  transcript: ExchangeMessage[];
  tokens: string[];
}): Promise<TurnResult | null> {
  const { client, a, b, stage, speaker, transcript, tokens } = args;
  const self = speaker === "A" ? a : b;
  const other = speaker === "A" ? b : a;
  const agenda = generateMeetingAgenda(a, b, stage);
  // Questions this side is allowed to voice are the ones ABOUT the other person.
  const myOpenQuestions = speaker === "A" ? agenda.questionsForB : agenda.questionsForA;

  try {
    const response = await client.chat.completions.create({
      model: openAITurnModel,
      response_format: { type: "json_object" },
      temperature: 0.85,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content: [
            PERSONA_RULES,
            `You are ${nameOf(self)}'s Shadow. The other Shadow represents ${nameOf(other)}.`,
            `Current stage: ${STAGE_LABELS[stage]}. Goal of this stage: ${STAGE_PURPOSE[stage]}`
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            you: `${nameOf(self)}'s Shadow`,
            myPersonFullProfile: self,
            otherPersonShareableView: shareableView(other),
            // Things THIS Shadow wants to learn about the OTHER person.
            iStillWantToLearnAboutThem: myOpenQuestions,
            transcriptSoFar: transcriptForPrompt(transcript),
            instruction: transcript.length
              ? "React to the last line and continue the conversation with your single next line."
              : "Open the conversation naturally with your single first line."
          })
        }
      ]
    });

    const raw = response.choices[0]?.message.content;
    if (!raw) return null;
    const parsed = turnResultSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;

    // Privacy guard: never surface a protected term. Drop the leaking turn.
    if (leaksPrivateData(parsed.data.content, tokens)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

/** Single verdict pass: a stronger model grades the WHOLE real transcript. */
async function gradeVerdict(args: {
  client: NonNullable<MeetingClient>;
  a: ShadowProfile;
  b: ShadowProfile;
  transcript: ExchangeMessage[];
  stages: MeetingStage[];
  tokens: string[];
}): Promise<Verdict | null> {
  const { client, a, b, transcript, stages, tokens } = args;
  if (transcript.length === 0) return null;

  try {
    const response = await client.chat.completions.create({
      model: openAIVerdictModel,
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 650,
      messages: [
        {
          role: "system",
          content: [
            "You are Shadow's verdict engine. Two AI representatives ('Shadows') just held a live compatibility meeting on behalf of their two humans. You are given the ACTUAL transcript plus the shareable view of each person.",
            "Grade EMOTIONAL RESONANCE — how the two people actually affect each other based on what was really said — NOT surface similarity or shared hobbies. Consider: regulation vs activation of each other's nervous system, whether differences feel complementary or irritating, whether the conversation recovered after friction, curiosity left over, and what residue remained.",
            "Output strict JSON: { \"emotionalResonanceScore\": 0-100, \"resonanceRationale\": string, \"perStage\": [ { \"stage\": one of surface|values_rhythm|friction_test|logistics|handoff, \"alignment\": string[], \"friction\": string[], \"factsAboutA\": string[], \"factsAboutB\": string[], \"unresolvedForA\": string[], \"unresolvedForB\": string[] } ] }.",
            "Base everything strictly on the transcript and shareable views. Do not invent private history. `factsAboutA`/`factsAboutB` are concrete things established about each person during the meeting. Keep each string short and concrete.",
            "PUNCTUATION RULE (strict): never use em dashes or en dashes; use commas, periods, or regular hyphens."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            personA: { name: nameOf(a), shareableView: shareableView(a) },
            personB: { name: nameOf(b), shareableView: shareableView(b) },
            stagesCovered: stages,
            transcript: transcript.map((m) => ({
              stage: m.stage,
              speaker: m.speakerLabel,
              line: m.content
            }))
          })
        }
      ]
    });

    const raw = response.choices[0]?.message.content;
    if (!raw) return null;
    const parsed = verdictSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;

    // Privacy guard: strip any extracted string that leaks a protected term.
    const clean = (xs: string[]) => xs.filter((x) => !leaksPrivateData(x, tokens));
    return {
      ...parsed.data,
      perStage: parsed.data.perStage.map((p) => ({
        ...p,
        alignment: clean(p.alignment),
        friction: clean(p.friction),
        factsAboutA: clean(p.factsAboutA),
        factsAboutB: clean(p.factsAboutB),
        unresolvedForA: clean(p.unresolvedForA),
        unresolvedForB: clean(p.unresolvedForB)
      }))
    };
  } catch {
    return null;
  }
}

/**
 * Stream a genuine turn-by-turn Shadow meeting. Each yielded event is meant to
 * be serialised straight to an SSE stream by the route.
 *
 * There is NO demo/deterministic fallback — if the OpenAI client is missing the
 * stream errors immediately so the client knows agents are unavailable.
 */
export async function* streamLiveMeeting(
  a: ShadowProfile,
  b: ShadowProfile,
  options?: LiveMeetingOptions,
  // Defaults to the env-configured OpenAI client. Injectable for tests so the
  // sequential turn loop can be exercised without a real key.
  client: MeetingClient = getOpenAI()
): AsyncGenerator<LiveMeetingEvent> {
  const liveClient = requireLiveClient(client);
  const preScreen = buildCandidatePreScreen(a, b, options?.prevMemory);

  yield { type: "meta", source: "openai", preScreen };

  const stages = options?.stages ?? defaultStages(options?.prevMemory, preScreen);
  const tokens = disclosureTokens(a, b);
  const allTurns: ExchangeMessage[] = [];
  const turnsByStage = new Map<MeetingStage, ExchangeMessage[]>();

  for (let i = 0; i < stages.length; i++) {
    if (allTurns.length >= MAX_LIVE_TURNS_TOTAL) break;

    const stage = stages[i];
    yield { type: "stage", stage, label: STAGE_LABELS[stage], index: i, total: stages.length };

    const stageTurns: ExchangeMessage[] = [];
    turnsByStage.set(stage, stageTurns);
    if (!CONVERSATIONAL_STAGES.includes(stage)) continue;

    let speaker: "A" | "B" = "A";
    let aDone = false;
    let bDone = false;
    for (let t = 0; t < MAX_LIVE_TURNS_PER_STAGE; t++) {
      if (allTurns.length >= MAX_LIVE_TURNS_TOTAL) break;

      const turn = await generateTurn({
        client: liveClient,
        a,
        b,
        stage,
        speaker,
        transcript: allTurns,
        tokens
      });
      if (!turn) break;
      const message = toExchangeMessage(turn, stage, a, b, speaker);
      stageTurns.push(message);
      allTurns.push(message);
      yield { type: "turn", message };

      if (turn.stageGoalMet) {
        if (speaker === "A") aDone = true;
        else bDone = true;
      }
      // Stop once both sides feel the stage goal is met and each has spoken.
      if (aDone && bDone && stageTurns.length >= 2) break;
      speaker = speaker === "A" ? "B" : "A";
    }
  }

  // Verdict pass over the REAL transcript (stronger model). On any failure we
  // fall back to the deterministic conclusions below, so the report stays rich.
  const verdict = await gradeVerdict({ client: liveClient, a, b, transcript: allTurns, stages, tokens });

  // Deterministic run is always computed as the grounding/guardrail baseline:
  // it supplies conclusions/first-date when the verdict pass is unavailable, and
  // its non-negotiable + intent gates still apply inside runShadowMeetingFromLive.
  const det = runShadowMeeting(a, b, {
    stages,
    prevMemory: options?.prevMemory,
    now: options?.now
  });
  const detByStage = new Map<MeetingStage, StructuredMeetingResult>(
    det.stageResults.map((s) => [s.stage, s])
  );

  const liveStages: LiveStageInput[] = stages.map((stage) => {
    const base = detByStage.get(stage);
    const v = verdict?.perStage.find((p) => p.stage === stage);
    const realTurns = turnsByStage.get(stage) ?? [];
    return {
      stage,
      // Prefer the REAL live turns; only fall back to the deterministic skeleton
      // for non-conversational stages (logistics/handoff) that produced none.
      exchange: realTurns.length ? realTurns : base?.exchange ?? [],
      alignment: v?.alignment ?? base?.alignment ?? [],
      friction: v?.friction ?? base?.friction ?? [],
      factsAboutA: v?.factsAboutA ?? base?.factsAboutA ?? [],
      factsAboutB: v?.factsAboutB ?? base?.factsAboutB ?? [],
      unresolvedForA: v?.unresolvedForA ?? base?.unresolvedForA ?? [],
      unresolvedForB: v?.unresolvedForB ?? base?.unresolvedForB ?? [],
      firstDateSuggestion: base?.firstDateSuggestion
    };
  });

  const run = runShadowMeetingFromLive(a, b, liveStages, {
    prevMemory: options?.prevMemory,
    meetingId: options?.meetingId,
    now: options?.now,
    liveResonanceScore: verdict?.emotionalResonanceScore,
    liveResonanceWeight: LIVE_RESONANCE_WEIGHT
  });

  yield { type: "verdict", run, source: "openai" };
}

/**
 * Non-streaming convenience wrapper: run the full live meeting and return the
 * final run plus the flat transcript. Handy for the legacy one-shot endpoint
 * and for tests.
 */
export async function runLiveMeeting(
  a: ShadowProfile,
  b: ShadowProfile,
  options?: LiveMeetingOptions,
  client: MeetingClient = getOpenAI()
): Promise<{ run: ShadowMeetingRun; source: LiveMeetingSource; transcript: ExchangeMessage[] }> {
  let run: ShadowMeetingRun | null = null;
  const transcript: ExchangeMessage[] = [];
  for await (const event of streamLiveMeeting(a, b, options, client)) {
    if (event.type === "turn") transcript.push(event.message);
    else if (event.type === "verdict") run = event.run;
  }
  if (!run) {
    throw new AgentsUnavailableError("The live agent meeting ended without a verdict.");
  }
  return { run, source: "openai", transcript };
}

// Keep MEETING_STAGES referenced so the ordered-stage contract stays in sync.
export const LIVE_STAGES = MEETING_STAGES;
