import { NextResponse } from "next/server";
import { z } from "zod";

import {
  demoAIMeeting,
  generateAIMeeting,
  type ProxyRepresentative
} from "@/lib/ai";
import { generateDbMeeting, getMeetingReadiness } from "@/lib/db-meetings";
import { saveMeeting } from "@/lib/meeting-store";

export const maxDuration = 60;

const proxyRepresentativeSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(18).max(120).optional(),
  occupation: z.string().optional(),
  location: z.string().optional(),
  values: z.array(z.string()),
  traits: z.array(z.string()),
  goals: z.array(z.string()),
  communicationStyle: z.string(),
  humourStyle: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  relationshipPreferences: z.array(z.string()),
  summary: z.string()
});

const createMeetingSchema = z.object({
  meetingId: z.string().optional(),
  proxyAId: z.string().optional(),
  proxyBId: z.string().optional(),
  proxyA: proxyRepresentativeSchema.optional(),
  proxyB: proxyRepresentativeSchema.optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = createMeetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid meeting request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const proxyA = parsed.data.proxyA as ProxyRepresentative | undefined;
  const proxyB = parsed.data.proxyB as ProxyRepresentative | undefined;
  const meetingId = parsed.data.meetingId ?? "demo";

  if (meetingId === "demo") {
    return NextResponse.json(saveMeeting(demoAIMeeting(meetingId)));
  }

  const dbMeeting = await generateDbMeeting(meetingId);

  if (dbMeeting) {
    return NextResponse.json(dbMeeting);
  }

  const readiness = await getMeetingReadiness(meetingId);

  if (readiness && !readiness.isReady) {
    return NextResponse.json(
      {
        error:
          "This invite is still waiting for the second person to create a Shadow and accept."
      },
      { status: 409 }
    );
  }

  if (!proxyA || !proxyB) {
    return NextResponse.json(
      {
        error:
          "No paired invite was found for this meeting. Create an invite and wait for the other person to accept before starting."
      },
      { status: 404 }
    );
  }

  const meeting = await generateAIMeeting({
    meetingId,
    proxyA,
    proxyB
  }).catch((error) => ({
    ...demoAIMeeting(meetingId, proxyA, proxyB),
    warning:
      error instanceof Error
        ? error.message
        : "AI meeting generation failed; returned a preview transcript."
  }));

  saveMeeting(meeting);

  return NextResponse.json(meeting);
}
