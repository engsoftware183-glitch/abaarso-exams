import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function ExportDataPage() {
  return <ModulePage config={getModuleConfig("tools")} variant="Export Data" />;
}
