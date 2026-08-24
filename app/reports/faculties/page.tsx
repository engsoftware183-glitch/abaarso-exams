import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function FacultyReportsPage() {
  return <ModulePage config={getModuleConfig("reports")} variant="Faculty Performance" />;
}
