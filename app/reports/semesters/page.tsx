import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function SemesterReportsPage() {
  return <ModulePage config={getModuleConfig("reports")} variant="Semester Performance" />;
}
