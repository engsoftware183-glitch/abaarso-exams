import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function ProfilePage() {
  return <ModulePage config={getModuleConfig("profile")} />;
}
