import { redirect } from "next/navigation";

import { ReportView } from "@/components/reports/report-view";
import { demoAIMeeting } from "@/lib/ai";
import { generateDbMeeting } from "@/lib/db-meetings";
import { getStoredMeeting, saveMeeting } from "@/lib/meeting-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function ReportPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "live" || id === "live-demo") {
    redirect("/dashboard/meetings");
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
    redirect("/dashboard/meetings");
  }

  return <ReportView reportId={id} report={meeting.report} source={meeting.source} />;
}
