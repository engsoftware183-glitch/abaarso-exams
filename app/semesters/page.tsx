import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function SemestersPage() {
  return <ModulePage config={getModuleConfig("semesters")} />;
}
