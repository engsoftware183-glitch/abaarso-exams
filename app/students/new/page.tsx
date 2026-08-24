import { CrudModule } from "@/components/modules/CrudModule";
import { studentsConfig } from "@/lib/crud-config";

export default function NewStudentPage() {
  return <CrudModule config={studentsConfig} />;
}
