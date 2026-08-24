import { CrudModule } from "@/components/modules/CrudModule";
import { examsConfig } from "@/lib/crud-config";

export default function ExamsPage() {
  return <CrudModule config={examsConfig} />;
}
