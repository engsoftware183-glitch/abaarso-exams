import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function StudentsPage() {
  return <ModulePage config={getModuleConfig("students")} />;
}
