import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function DepartmentReportsPage() {
  return <ModulePage config={getModuleConfig("reports")} variant="Department Performance" />;
}
