import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function DepartmentsPage() {
  return <ModulePage config={getModuleConfig("departments")} />;
}
