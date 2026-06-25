import { FieldMeetingRoom } from "@/components/field/field-meeting-room";

export default async function FieldMeetingPage({
  params
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  return <FieldMeetingRoom candidateId={candidateId} />;
}
