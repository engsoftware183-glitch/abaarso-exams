import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function AcademicsPage() {
  return <ModulePage config={getModuleConfig("academics")} />;
}
