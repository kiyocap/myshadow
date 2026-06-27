import { MeetingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  databaseReady,
  saveShadowSchema,
  saveUserShadow
} from "@/lib/db-shadow";
import { acceptInviteForUser } from "@/lib/db-meetings";
import { runLiveMeeting } from "@/lib/field/live";
import type { ShadowProfile } from "@/lib/field/types";
import { requireLiveMobileUser } from "@/lib/mobile-auth";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const mobileIdentitySchema = z
  .object({
    userKey: z.string().optional().nullable(),
    inviteCode: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    displayName: z.string().optional().nullable(),
    mobileSessionToken: z.string().optional().nullable(),
    appleUserId: z.string().optional().nullable()
  })
  .passthrough();

const inviteMeetingSchema = z.object({
  identity: mobileIdentitySchema,
  shadow: saveShadowSchema
});

type StoredProxy = {
  userId: string;
  displayName: string;
  age: number | null;
  occupation: string | null;
  location: string | null;
  motivation: string;
  frustrations: string;
  goals: string;
  lookingFor: string;
  greatRelationship: string;
  values: unknown;
  traits: unknown;
  generatedProfile: unknown;
  communicationStyle: string;
  humourStyle: string;
  strengths: unknown;
  weaknesses: unknown;
  relationshipPreferences: unknown;
  summary: string;
};

function cleanText(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || /^not provided yet\.?$/i.test(trimmed)) return undefined;
  return trimmed;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

function generatedArray(
  generated: Record<string, unknown>,
  key: string,
  fallback: unknown
) {
  const generatedValues = stringArray(generated[key]);
  return generatedValues.length ? generatedValues : stringArray(fallback);
}

function textList(value: string) {
  return cleanText(value)
    ?.split(/,\s*|\n+/)
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}

function proxyToLiveProfile(proxy: StoredProxy): ShadowProfile {
  const generated =
    proxy.generatedProfile && typeof proxy.generatedProfile === "object"
      ? (proxy.generatedProfile as Record<string, unknown>)
      : {};
  const locationParts =
    proxy.location
      ?.split("·")
      .map((part) => part.trim())
      .filter(Boolean) ?? [];

  const values = generatedArray(generated, "values", proxy.values);
  const traits = generatedArray(generated, "traits", proxy.traits);
  const strengths = generatedArray(generated, "strengths", proxy.strengths);
  const weaknesses = generatedArray(generated, "weaknesses", proxy.weaknesses);
  const relationshipPreferences = generatedArray(
    generated,
    "relationshipPreferences",
    proxy.relationshipPreferences
  );
  const goals = generatedArray(generated, "goals", []);
  const summary = cleanText(
    typeof generated.summary === "string" ? generated.summary : proxy.summary
  );

  return {
    userId: proxy.userId,
    displayName: proxy.displayName,
    age: proxy.age ?? undefined,
    locationArea: locationParts[0] ?? cleanText(proxy.location),
    homeArea: locationParts[0] ?? cleanText(proxy.location),
    workArea: locationParts[1],
    relationshipIntent: cleanText(proxy.lookingFor),
    values,
    personalityTraits: traits,
    communicationStyle:
      typeof generated.communicationStyle === "string"
        ? generated.communicationStyle
        : cleanText(proxy.communicationStyle),
    humourStyle:
      typeof generated.humourStyle === "string"
        ? generated.humourStyle
        : cleanText(proxy.humourStyle),
    ambitionGoals: goals.length ? goals : textList(proxy.goals),
    emotionalNeeds: relationshipPreferences,
    lifestylePreferences: textList(proxy.greatRelationship),
    conflictStyle: cleanText(proxy.communicationStyle),
    greenFlags: strengths,
    redFlags: weaknesses,
    lookingFor: textList(proxy.lookingFor),
    frustrations: textList(proxy.frustrations),
    shareableFacts: [
      summary,
      cleanText(proxy.lookingFor),
      cleanText(proxy.goals)
    ].filter((item): item is string => Boolean(item)),
    sourceNotes: [
      cleanText(proxy.motivation),
      cleanText(proxy.frustrations),
      cleanText(proxy.goals),
      cleanText(proxy.greatRelationship)
    ].filter((item): item is string => Boolean(item)),
    doNotDisclose: []
  };
}

function authError(error: Error) {
  switch (error.message) {
    case "LIVE_AUTH_EXPIRED":
      return NextResponse.json(
        { error: "Your Apple sign-in expired. Please sign in again to accept this invite." },
        { status: 401 }
      );
    case "LIVE_AUTH_REQUIRED":
      return NextResponse.json(
        { error: "Sign in with Apple before accepting this invite." },
        { status: 401 }
      );
    default:
      return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!databaseReady()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required to run invite meetings." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = inviteMeetingSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invite meeting payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { code } = await params;
  const db = getPrisma();
  let activeMeetingId: string | null = null;

  try {
    const user = await requireLiveMobileUser(parsed.data.identity);
    await saveUserShadow(user.id, parsed.data.shadow);
    const joined = await acceptInviteForUser(code, user.id);
    activeMeetingId = joined.meetingId;

    if (joined.participantCount < 2) {
      return NextResponse.json(
        { error: "Waiting for the inviter's Shadow to be ready." },
        { status: 409 }
      );
    }

    const meeting = await db.meeting.findUnique({
      where: { id: joined.meetingId },
      include: {
        participants: {
          orderBy: { role: "asc" },
          include: { proxy: true }
        }
      }
    });

    if (!meeting || meeting.participants.length < 2) {
      return NextResponse.json(
        { error: "This invite is not ready yet." },
        { status: 409 }
      );
    }

    const userParticipant = meeting.participants.find(
      (participant) => participant.proxy.userId === user.id
    );
    const otherParticipant = meeting.participants.find(
      (participant) => participant.proxy.userId !== user.id
    );

    if (!userParticipant || !otherParticipant) {
      return NextResponse.json(
        { error: "This invite is connected to different Shadows." },
        { status: 403 }
      );
    }

    const viewer = proxyToLiveProfile(userParticipant.proxy);
    const candidate = proxyToLiveProfile(otherParticipant.proxy);
    const participants = {
      userName: viewer.displayName ?? "You",
      candidateName: candidate.displayName ?? "Their Shadow",
      candidate: {
        id: candidate.userId,
        name: candidate.displayName ?? "Their Shadow",
        age: candidate.age ?? 30,
        occupation: otherParticipant.proxy.occupation ?? "Invited Shadow",
        location: candidate.homeArea ?? candidate.locationArea ?? "Private invite"
      }
    };

    await db.meeting.update({
      where: { id: meeting.id },
      data: { status: MeetingStatus.RUNNING, startedAt: new Date() }
    });

    const { run } = await runLiveMeeting(viewer, candidate);

    await db.meeting.update({
      where: { id: meeting.id },
      data: { status: MeetingStatus.COMPLETED, completedAt: new Date() }
    });

    return NextResponse.json({
      source: "openai",
      preScreen: run.preScreen,
      stageResults: run.stageResults,
      memory: run.memory,
      report: run.report,
      participants
    });
  } catch (error) {
    if (activeMeetingId) {
      await db.meeting
        .update({
          where: { id: activeMeetingId },
          data: { status: MeetingStatus.FAILED }
        })
        .catch(() => null);
    }

    if (error instanceof Error) {
      const authResponse = authError(error);
      if (authResponse) return authResponse;

      if (error.message === "SHADOW_REQUIRED") {
        return NextResponse.json(
          { error: "Create your Shadow before accepting this invite." },
          { status: 409 }
        );
      }

      if (error.message === "INVITE_FULL") {
        return NextResponse.json(
          { error: "This invite already has two Shadows connected." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message || "The invite meeting could not start." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "The invite meeting could not start." },
      { status: 502 }
    );
  }
}
