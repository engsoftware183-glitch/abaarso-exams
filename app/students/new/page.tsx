import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function NewStudentPage() {
  return <ModulePage config={getModuleConfig("students")} variant="Register Student" />;
}
