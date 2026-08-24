import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function SettingsPage() {
  return <ModulePage config={getModuleConfig("settings")} />;
}
