import { CrudModule } from "@/components/modules/CrudModule";
import { attendanceConfig } from "@/lib/crud-config";

export default function AttendancePage() {
  return <CrudModule config={attendanceConfig} />;
}
