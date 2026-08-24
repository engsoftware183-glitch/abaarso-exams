import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleConfig } from "@/lib/module-config";

export default function SearchTranscriptPage() {
  return <ModulePage config={getModuleConfig("transcripts")} variant="Search Transcript" />;
}
