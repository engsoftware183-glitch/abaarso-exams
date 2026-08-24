import { CrudModule } from "@/components/modules/CrudModule";
import { assessmentsConfig } from "@/lib/crud-config";

export default function AssessmentsPage() {
  return <CrudModule config={assessmentsConfig} />;
}
