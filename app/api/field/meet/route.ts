import { NextResponse } from "next/server";
import { z } from "zod";

import { nearbyMatches } from "@/lib/discover-data";
import {
  localProfileToShadowProfile,
  nearbyMatchToShadowProfile
} from "@/lib/field/adapters";
import { runLiveMeeting } from "@/lib/field/live";
import type { LocalProxyProfile } from "@/lib/proxy-storage";

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
  candidateId: z.string().min(1),
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
    .passthrough()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid meeting request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const match = nearbyMatches.find((m) => m.id === parsed.data.candidateId);
  if (!match) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  const user = localProfileToShadowProfile(
    parsed.data.localProfile as unknown as LocalProxyProfile
  );
  const candidate = nearbyMatchToShadowProfile(match);

  try {
    const { run } = await runLiveMeeting(user, candidate);

    return NextResponse.json({
      source: "openai",
      preScreen: run.preScreen,
      stageResults: run.stageResults,
      memory: run.memory,
      report: run.report,
      participants: {
        userName: user.displayName ?? "You",
        candidateName: candidate.displayName ?? match.name,
        candidate: {
          id: match.id,
          name: match.name,
          age: match.age,
          occupation: match.occupation,
          location: match.location
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The Shadow meeting could not be generated. Please retry in a moment."
      },
      { status: 502 }
    );
  }
}
