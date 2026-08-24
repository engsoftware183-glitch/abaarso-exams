import { CrudModule } from "@/components/modules/CrudModule";
import { studentsConfig } from "@/lib/crud-config";

export default function StudentsPage() {
  return <CrudModule config={studentsConfig} />;
}
