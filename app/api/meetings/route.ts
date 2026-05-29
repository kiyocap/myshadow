import { NextResponse } from "next/server";
import { z } from "zod";

import { demoAIMeeting } from "@/lib/ai";
import { generateDbMeeting, getMeetingReadiness } from "@/lib/db-meetings";
import { saveMeeting } from "@/lib/meeting-store";

export const maxDuration = 60;

const createMeetingSchema = z.object({
  meetingId: z.string().min(1)
}).strict();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = createMeetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid meeting request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const meetingId = parsed.data.meetingId;

  if (meetingId === "demo") {
    return NextResponse.json(saveMeeting(demoAIMeeting(meetingId)));
  }

  let dbMeeting;

  try {
    dbMeeting = await generateDbMeeting(meetingId);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI meeting generation failed. Please retry in a moment."
      },
      { status: 502 }
    );
  }

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

  return NextResponse.json(
    {
      error:
        "No paired invite was found for this meeting. Create an invite and wait for the other person to accept before starting."
    },
    { status: 404 }
  );
}
