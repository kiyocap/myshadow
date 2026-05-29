import { NextResponse } from "next/server";
import { z } from "zod";

import {
  demoAIMeeting,
  demoProxyRepresentative,
  generateAIMeeting,
  type ProxyRepresentative
} from "@/lib/ai";
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

  const proxyA =
    (parsed.data.proxyA as ProxyRepresentative | undefined) ??
    demoProxyRepresentative("Hewie");
  const proxyB =
    (parsed.data.proxyB as ProxyRepresentative | undefined) ??
    demoProxyRepresentative("Hayley");
  const meetingId = parsed.data.meetingId ?? "live-demo";

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
