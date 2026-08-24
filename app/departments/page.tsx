import { CrudModule } from "@/components/modules/CrudModule";
import { departmentsConfig } from "@/lib/crud-config";

export default function DepartmentsPage() {
  return <CrudModule config={departmentsConfig} />;
}
