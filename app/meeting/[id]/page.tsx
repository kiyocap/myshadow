import { redirect } from "next/navigation";

import { MeetingRoom } from "@/components/meeting/meeting-room";

export default async function MeetingPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "live" || id === "live-demo") {
    redirect("/dashboard/meetings");
  }

  return <MeetingRoom meetingId={id} />;
}
