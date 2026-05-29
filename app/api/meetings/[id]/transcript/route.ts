import { NextResponse } from "next/server";

import { demoAIMeeting, generateAIMeeting } from "@/lib/ai";
import { generateDbMeeting, getMeetingReadiness } from "@/lib/db-meetings";
import { getStoredMeeting, saveMeeting } from "@/lib/meeting-store";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const storedMeeting = getStoredMeeting(id);

  if (storedMeeting) {
    return NextResponse.json(storedMeeting);
  }

  if (id === "demo") {
    return NextResponse.json(saveMeeting(demoAIMeeting(id)));
  }

  const dbMeeting = await generateDbMeeting(id);

  if (dbMeeting) {
    return NextResponse.json(dbMeeting);
  }

  const readiness = await getMeetingReadiness(id);

  if (readiness && !readiness.isReady) {
    return NextResponse.json(
      {
        error:
          "This invite is still waiting for the second person to create a Shadow and accept."
      },
      { status: 409 }
    );
  }

  try {
    const meeting = await generateAIMeeting({ meetingId: id });

    saveMeeting(meeting);

    return NextResponse.json(meeting);
  } catch (error) {
    const meeting = {
      ...demoAIMeeting(id),
      source: "demo",
      warning:
      error instanceof Error
        ? error.message
        : "AI meeting generation failed; returned a preview transcript."
    } as const;

    saveMeeting(meeting);

    return NextResponse.json(meeting);
  }
}
