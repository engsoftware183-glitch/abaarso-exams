import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function TranscriptsPage() {
  return <ModulePage config={getModuleConfig("transcripts")} />;
}
