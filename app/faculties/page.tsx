import { CrudModule } from "@/components/modules/CrudModule";
import { facultiesConfig } from "@/lib/crud-config";

export default function FacultiesPage() {
  return <CrudModule config={facultiesConfig} />;
}
