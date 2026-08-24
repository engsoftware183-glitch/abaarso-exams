import { CrudModule } from "@/components/modules/CrudModule";
import { coursesConfig } from "@/lib/crud-config";

export default function CoursesPage() {
  return <CrudModule config={coursesConfig} />;
}
