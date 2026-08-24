import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function CgpaRankingPage() {
  return <ModulePage config={getModuleConfig("reports")} variant="CGPA Ranking" />;
}
