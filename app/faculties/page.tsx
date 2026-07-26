import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function FacultiesPage() {
  return <ModulePage config={getModuleConfig("faculties")} />;
}
