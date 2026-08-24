import { CrudModule } from "@/components/modules/CrudModule";
import { studentExamsConfig } from "@/lib/crud-config";

export default function StudentExamsPage() {
  return <CrudModule config={studentExamsConfig} />;
}
