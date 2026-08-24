import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function AuditLogsPage() {
  return <ModulePage config={getModuleConfig("audit-logs")} />;
}
