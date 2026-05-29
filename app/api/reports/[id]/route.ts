import { NextResponse } from "next/server";

import { demoAIMeeting, generateAIMeeting } from "@/lib/ai";
import { getStoredMeeting, saveMeeting } from "@/lib/meeting-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const storedMeeting = getStoredMeeting(id);
  const meeting =
    storedMeeting ??
    (id === "demo"
      ? saveMeeting(demoAIMeeting(id))
      : await generateAIMeeting({ meetingId: id })
          .then(saveMeeting)
          .catch(() => saveMeeting(demoAIMeeting(id))));

  return NextResponse.json({
    id,
    title: "What Your AIs Learned",
    source: meeting.source,
    ...meeting.report
  });
}
