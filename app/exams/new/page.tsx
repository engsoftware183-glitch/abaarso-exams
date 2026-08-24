import { CrudModule } from "@/components/modules/CrudModule";
import { examsConfig } from "@/lib/crud-config";

export default function NewExamPage() {
  return <CrudModule config={examsConfig} />;
}
