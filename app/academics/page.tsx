import { CrudModule } from "@/components/modules/CrudModule";
import { academicsConfig } from "@/lib/crud-config";

export default function AcademicsPage() {
  return <CrudModule config={academicsConfig} />;
}
