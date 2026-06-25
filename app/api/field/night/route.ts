import { NextResponse } from "next/server";
import { z } from "zod";

import { nearbyMatches, type NearbyMatch } from "@/lib/discover-data";
import {
  localProfileToShadowProfile,
  nearbyMatchToShadowProfile
} from "@/lib/field/adapters";
import {
  rankScreened,
  runNightConversations,
  screenCandidates,
  selectShortlist
} from "@/lib/field/night";
import type { LocalProxyProfile } from "@/lib/proxy-storage";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/field/night — "Let your Shadow out" overnight Field run.
//
// Premise: the user's Shadow autonomously goes out and has REAL engine
// conversations with other Shadows; the user reviews the readings in the
// morning (or watches them arrive live).
//
// COST LADDER (cheap → expensive):
//   • Pre-screen EVERY candidate cheaply (deterministic). This is the broad
//     "your Shadow met N people" sweep — returned as `metCount` + `shortlist`.
//   • Run FULL, LLM-narrated conversations only on the most promising shortlist
//     (target `desiredCount`, default 8) — the curated deep readings.
//
// BATCHING (to respect Vercel's maxDuration): the client may call this route
// in two complementary ways —
//   1. `{ screenOnly: true }`  → fast: returns metCount + ranked shortlist, no
//      LLM, no full conversations. The client shows the roaming orb + climbing
//      counter immediately.
//   2. `{ candidateIds: [...] }` → runs full conversations ONLY for those ids
//      (a small batch). The client pulls the shortlist down a few at a time so
//      finished conversations "arrive" in the feed naturally.
//   If neither flag is set, the route runs full live-agent conversations for
//   the whole shortlist sequentially (client should batch in production).
//
// REQUEST:
// {
//   localProfile: { name, age?, location?, homeLocation?, workLocation?,
//                   profile, guidedAnswers? },        // same shape as /api/field/meet
//   filters?: { maxDistanceMiles?, minAge?, maxAge?, minScore?,
//               ethnicities?: string[], industries?: string[] },
//   desiredCount?: number,        // target full conversations (default 8)
//   candidateIds?: string[],      // run full conversations only for these
//   screenOnly?: boolean          // skip full conversations entirely
// }
//
// RESPONSE:
// {
//   source: "openai",                    // live agent conversations only
//   generatedAt: string,
//   metCount: number,                     // candidates pre-screened (broad sweep)
//   desiredCount: number,
//   summary: string,
//   shortlist: [ { candidateId, name, age, occupation, location,
//                  surfaceScore, shouldContinue, recommendationHint } ],
//   results: [ {                          // batched per-candidate, SAME shape as
//     candidateId,                        //   /api/field/meet returns per call
//     source, preScreen, stageResults, memory, report,
//     participants: { userName, candidateName, candidate: {...} }
//   } ]
// }
// ─────────────────────────────────────────────────────────────────────────────

export const maxDuration = 300;

const generatedProfileSchema = z
  .object({
    values: z.array(z.string()).default([]),
    traits: z.array(z.string()).default([]),
    goals: z.array(z.string()).default([]),
    communicationStyle: z.string().default(""),
    humourStyle: z.string().default(""),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    relationshipPreferences: z.array(z.string()).default([]),
    summary: z.string().default("")
  })
  .passthrough();

const bodySchema = z.object({
  localProfile: z
    .object({
      name: z.string().min(1),
      age: z.number().optional(),
      location: z.string().optional(),
      homeLocation: z.string().optional(),
      workLocation: z.string().optional(),
      profile: generatedProfileSchema,
      guidedAnswers: z.record(z.array(z.string())).optional()
    })
    .passthrough(),
  filters: z
    .object({
      maxDistanceMiles: z.number().optional(),
      minAge: z.number().optional(),
      maxAge: z.number().optional(),
      minScore: z.number().optional(),
      ethnicities: z.array(z.string()).optional(),
      industries: z.array(z.string()).optional()
    })
    .optional(),
  desiredCount: z.number().int().min(1).max(12).optional(),
  candidateIds: z.array(z.string()).optional(),
  screenOnly: z.boolean().optional()
});

type Filters = NonNullable<z.infer<typeof bodySchema>["filters"]>;

function applyFilters(matches: NearbyMatch[], filters?: Filters): NearbyMatch[] {
  if (!filters) return matches;
  return matches.filter((m) => {
    if (filters.maxDistanceMiles != null && m.distanceMiles > filters.maxDistanceMiles) {
      return false;
    }
    if (filters.minAge != null && m.age < filters.minAge) return false;
    if (filters.maxAge != null && m.age > filters.maxAge) return false;
    if (filters.minScore != null && m.score < filters.minScore) return false;
    if (
      filters.ethnicities &&
      filters.ethnicities.length > 0 &&
      !filters.ethnicities.includes(m.ethnicity)
    ) {
      return false;
    }
    if (
      filters.industries &&
      filters.industries.length > 0 &&
      !filters.industries.includes(m.industry)
    ) {
      return false;
    }
    return true;
  });
}

function participantsFor(userName: string, match: NearbyMatch) {
  return {
    userName,
    candidateName: match.name,
    candidate: {
      id: match.id,
      name: match.name,
      age: match.age,
      occupation: match.occupation,
      location: match.location
    }
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid field-night request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { filters, candidateIds, screenOnly } = parsed.data;
  const desiredCount = parsed.data.desiredCount ?? 8;

  const user = localProfileToShadowProfile(
    parsed.data.localProfile as unknown as LocalProxyProfile
  );
  const userName = user.displayName ?? "You";

  // Pool the Shadow could meet tonight, after the user's "tonight's intentions".
  const pool = applyFilters(nearbyMatches, filters);
  if (pool.length === 0) {
    return NextResponse.json({
      source: "openai",
      generatedAt: new Date().toISOString(),
      metCount: 0,
      desiredCount,
      summary: "No Shadows matched tonight's intentions. Try widening them.",
      shortlist: [],
      results: []
    });
  }

  // 1. Cheap pre-screen of the whole pool — the broad "met N" sweep.
  const matchById = new Map(pool.map((m) => [m.id, m]));
  const userPool = pool.map(nearbyMatchToShadowProfile);
  const screened = screenCandidates(user, userPool);
  const ranked = rankScreened(screened);
  const shortlist = selectShortlist(ranked, desiredCount);

  const shortlistPayload = shortlist.map(({ candidate, preScreen }) => {
    const match = matchById.get(candidate.userId);
    return {
      candidateId: candidate.userId,
      name: match?.name ?? candidate.displayName ?? candidate.userId,
      age: match?.age,
      occupation: match?.occupation,
      location: match?.location,
      surfaceScore: preScreen.surfaceScore,
      shouldContinue: preScreen.shouldContinue,
      recommendationHint: preScreen.shouldContinue
        ? "Promising enough for a full conversation."
        : "Pre-screen flagged a likely mismatch."
    };
  });

  const now = new Date();

  // Mode 1: screen only — return the plan, no expensive conversations.
  if (screenOnly) {
    return NextResponse.json({
      source: "openai",
      generatedAt: now.toISOString(),
      metCount: pool.length,
      desiredCount,
      summary: `Your Shadow pre-screened ${pool.length} ${
        pool.length === 1 ? "Shadow" : "Shadows"
      } and is having ${shortlistPayload.length} full ${
        shortlistPayload.length === 1 ? "conversation" : "conversations"
      } tonight.`,
      shortlist: shortlistPayload,
      results: []
    });
  }

  // Decide which candidates get a FULL conversation this call.
  // If the client requested a specific batch, honour it (restricted to the
  // shortlist + pool); otherwise run the whole shortlist.
  let toRun = shortlist;
  if (candidateIds && candidateIds.length > 0) {
    const wanted = new Set(candidateIds);
    toRun = ranked.filter((s) => wanted.has(s.candidate.userId));
    // Allow requesting any pool candidate, not just the auto-shortlist.
    if (toRun.length === 0) {
      toRun = screened.filter((s) => wanted.has(s.candidate.userId));
    }
  }

  try {
    const conversations = await runNightConversations(
      user,
      toRun.map((s) => s.candidate),
      now
    );

    const results = conversations.map((conv) => {
      const match = matchById.get(conv.candidateId);
      return {
        candidateId: conv.candidateId,
        source: conv.source,
        preScreen: conv.preScreen,
        stageResults: conv.stageResults,
        memory: conv.memory,
        report: conv.report,
        participants: participantsFor(
          userName,
          match ?? {
            id: conv.candidateId,
            name: conv.candidateId,
            age: 0,
            occupation: "",
            location: ""
          } as NearbyMatch
        )
      };
    });

    const recommended = results.filter(
      (r) => r.report.recommendationStatus === "recommended"
    ).length;
    const source = "openai" as const;

    return NextResponse.json({
      source,
      generatedAt: now.toISOString(),
      metCount: pool.length,
      desiredCount,
      summary: `Your Shadow met ${pool.length} ${
        pool.length === 1 ? "Shadow" : "Shadows"
      } and had ${results.length} real ${
        results.length === 1 ? "conversation" : "conversations"
      }${recommended ? `, ${recommended} worth your attention` : ""}.`,
      shortlist: shortlistPayload,
      results
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The overnight field run could not be generated. Please retry in a moment."
      },
      { status: 502 }
    );
  }
}
