import { NextResponse } from "next/server";

import { demoAIMeeting } from "@/lib/ai";
import { generateDbMeeting } from "@/lib/db-meetings";
import { getStoredMeeting, saveMeeting } from "@/lib/meeting-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id === "live" || id === "live-demo") {
    return NextResponse.json(
      { error: "Reports are only available after a real invite meeting runs." },
      { status: 404 }
    );
  }

  const storedMeeting = getStoredMeeting(id);
  const dbMeeting = storedMeeting ? null : await generateDbMeeting(id);
  const meeting =
    storedMeeting ??
    dbMeeting ??
    (id === "demo"
      ? saveMeeting(demoAIMeeting(id))
      : null);

  if (!meeting) {
    return NextResponse.json(
      { error: "Report not found. Run a real invite meeting first." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id,
    title: "What Your AIs Learned",
    source: meeting.source,
    ...meeting.report
  });
}
