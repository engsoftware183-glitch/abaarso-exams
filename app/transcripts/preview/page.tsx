import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function TranscriptPreviewPage() {
  return <ModulePage config={getModuleConfig("transcripts")} variant="Transcript Preview" />;
}
