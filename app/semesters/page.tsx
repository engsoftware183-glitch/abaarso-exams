import { CrudModule } from "@/components/modules/CrudModule";
import { semestersConfig } from "@/lib/crud-config";

export default function SemestersPage() {
  return <CrudModule config={semestersConfig} />;
}
