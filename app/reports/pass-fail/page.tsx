import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function PassFailReportsPage() {
  return <ModulePage config={getModuleConfig("reports")} variant="Pass and Fail" />;
}
