import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function DownloadTranscriptPage() {
  return <ModulePage config={getModuleConfig("transcripts")} variant="Download PDF" />;
}
