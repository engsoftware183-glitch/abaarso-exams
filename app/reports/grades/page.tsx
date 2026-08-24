import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function GradeReportsPage() {
  return <ModulePage config={getModuleConfig("reports")} variant="Grade Distribution" />;
}
