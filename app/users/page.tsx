import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function UsersPage() {
  return <ModulePage config={getModuleConfig("users")} />;
}
