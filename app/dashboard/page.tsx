import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { compatibilityReport, transcript } from "@/lib/preview-data";

export default function DashboardPage() {
  return (
    <DashboardHome
      fallbackReport={compatibilityReport}
      fallbackTranscript={transcript}
    />
  );
}
