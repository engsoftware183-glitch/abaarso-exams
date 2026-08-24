"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, SkeletonLoader } from "@/components/ui/StateBlocks";
import { apiClient } from "@/lib/api-client";

type Attendance = {
  attendance_id: number;
  attendance_mark: number;
  attendance_percent: number;
  student: { full_name: string; roll_no: string };
  course: { course_code: string; course_name: string };
};

export default function StudentAttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAttendance() {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get<{ success: boolean; total: number; attendances: Attendance[] }>("/api/attendance");
      setAttendances(response.attendances ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAttendance();
  }, []);

  function getPercentTone(percent: number) {
    if (percent >= 80) return "green";
    if (percent >= 60) return "amber";
    return "red";
  }

  return (
    <AppShell title="My Attendance" description="Attendance records per course">
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load attendance" message={error} onRetry={loadAttendance} />
        ) : null}

        {loading ? (
          <SkeletonLoader rows={5} />
        ) : attendances.length ? (
          <div className="grid gap-4">
            {attendances.map((record) => (
              <div key={record.attendance_id} className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#F5DBE5] text-[#701F3D]">
                      <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111827]">
                        {record.course.course_name} ({record.course.course_code})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#6B7280]">Mark</p>
                      <p className="text-sm font-black text-[#111827]">{record.attendance_mark}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#6B7280]">Percent</p>
                      <p className="text-sm font-black text-[#111827]">{record.attendance_percent}%</p>
                    </div>
                    <Badge tone={getPercentTone(record.attendance_percent)}>
                      {record.attendance_percent >= 80 ? "Good" : record.attendance_percent >= 60 ? "Warning" : "Critical"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No attendance records" message="Attendance marks will appear here once recorded." />
        )}
      </div>
    </AppShell>
  );
}
