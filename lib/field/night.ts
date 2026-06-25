// "Let your Shadow out" — overnight Field night orchestration.
//
// This is the server-side brain behind the autonomous overnight flow. It layers
// a cheap → expensive cost ladder on top of the live agent meeting engine:
//
//   1. PRE-SCREEN every candidate cheaply (deterministic `buildCandidatePreScreen`).
//      This is what lets the product honestly say "your Shadow met N people" —
//      a broad, cheap sweep over the whole pool.
//   2. RANK the pre-screened pool and pick the most promising shortlist
//      (target ~8) for FULL live agent conversations.
//   3. Run genuine turn-by-turn agent meetings (`runLiveMeeting`) on the
//      shortlist — the curated deep readings the user actually reviews.
//
// There is NO demo/deterministic dialogue fallback. Each conversation is a real
// sequential agent exchange; if OPENAI_API_KEY is missing the route errors.

import { buildCandidatePreScreen } from "@/lib/field/engine";
import { runLiveMeeting } from "@/lib/field/live";
import type {
  PreScreenResult,
  ShadowProfile,
  StructuredMeetingResult
} from "@/lib/field/types";

export interface ScreenedCandidate {
  candidate: ShadowProfile;
  preScreen: PreScreenResult;
}

/** Cheap pass over the whole pool — the broad "met N" sweep. */
export function screenCandidates(
  user: ShadowProfile,
  candidates: ShadowProfile[]
): ScreenedCandidate[] {
  return candidates.map((candidate) => ({
    candidate,
    preScreen: buildCandidatePreScreen(user, candidate)
  }));
}

/**
 * Rank the pre-screened pool: viable candidates first, then by surface score.
 * This decides which candidates "graduate" from a cheap pre-screen to a full,
 * expensive conversation.
 */
export function rankScreened(screened: ScreenedCandidate[]): ScreenedCandidate[] {
  return [...screened].sort((a, b) => {
    if (a.preScreen.shouldContinue !== b.preScreen.shouldContinue) {
      return a.preScreen.shouldContinue ? -1 : 1;
    }
    return b.preScreen.surfaceScore - a.preScreen.surfaceScore;
  });
}

/** Pick the shortlist that earns a full conversation (target ~8). */
export function selectShortlist(
  ranked: ScreenedCandidate[],
  desiredCount: number
): ScreenedCandidate[] {
  return ranked.slice(0, Math.max(1, desiredCount));
}

export interface NightConversationResult {
  candidateId: string;
  source: "openai";
  preScreen: ReturnType<typeof buildCandidatePreScreen>;
  stageResults: StructuredMeetingResult[];
  memory: Awaited<ReturnType<typeof runLiveMeeting>>["run"]["memory"];
  report: Awaited<ReturnType<typeof runLiveMeeting>>["run"]["report"];
}

/**
 * Run full LIVE agent conversations for a set of candidates, one at a time.
 *
 * Sequential execution keeps each conversation a genuine turn-by-turn exchange
 * and avoids blowing Vercel's function timeout with parallel multi-agent runs.
 */
export async function runNightConversations(
  user: ShadowProfile,
  candidates: ShadowProfile[],
  now: Date
): Promise<NightConversationResult[]> {
  const results: NightConversationResult[] = [];
  for (const candidate of candidates) {
    const { run } = await runLiveMeeting(user, candidate, { now });
    results.push({
      candidateId: candidate.userId,
      source: "openai",
      preScreen: run.preScreen,
      stageResults: run.stageResults,
      memory: run.memory,
      report: run.report
    });
  }
  return results;
}
