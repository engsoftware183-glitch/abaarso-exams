import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function BulkUploadPage() {
  return <ModulePage config={getModuleConfig("tools")} variant="Bulk Upload" />;
}
