import { ReportsArchive } from "@/components/dashboard/reports-archive";
import { compatibilityReport } from "@/lib/preview-data";

export default function ReportsPage() {
  return <ReportsArchive fallbackReport={compatibilityReport} />;
}
