import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function CoursesPage() {
  return <ModulePage config={getModuleConfig("courses")} />;
}
