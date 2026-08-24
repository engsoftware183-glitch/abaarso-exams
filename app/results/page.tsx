import { CrudModule } from "@/components/modules/CrudModule";
import { resultsConfig } from "@/lib/crud-config";

export default function ResultsPage() {
  return <CrudModule config={resultsConfig} />;
}
