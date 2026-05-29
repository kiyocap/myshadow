import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { compatibilityReport, transcript } from "@/lib/sample-data";

export default function DashboardPage() {
  return (
    <DashboardHome
      fallbackReport={compatibilityReport}
      fallbackTranscript={transcript}
    />
  );
}
