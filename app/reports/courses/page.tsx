import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function CourseReportsPage() {
  return <ModulePage config={getModuleConfig("reports")} variant="Course Performance" />;
}
