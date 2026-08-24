import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function ImportDataPage() {
  return <ModulePage config={getModuleConfig("tools")} variant="Import Data" />;
}
