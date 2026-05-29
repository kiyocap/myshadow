import { ReportsArchive } from "@/components/dashboard/reports-archive";
import { compatibilityReport } from "@/lib/sample-data";

export default function ReportsPage() {
  return <ReportsArchive fallbackReport={compatibilityReport} />;
}
