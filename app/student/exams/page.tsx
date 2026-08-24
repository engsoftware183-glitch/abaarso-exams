"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, FileText, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonLoader } from "@/components/ui/StateBlocks";
import { apiClient } from "@/lib/api-client";

type Exam = {
  exam_id: number;
  exam_type: string;
  exam_date: string;
  total_marks: number;
  course: { course_name: string; course_code: string };
};

export default function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadExams() {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get<{ success: boolean; total: number; exams: Exam[] }>("/api/exams");
      setExams(response.exams ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load exams.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadExams();
  }, []);

  const now = Date.now();
  const upcomingExams = useMemo(
    () =>
      exams
        .filter((exam) => new Date(exam.exam_date).getTime() >= now)
        .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()),
    [exams, now]
  );

  const completedExams = useMemo(
    () =>
      exams
        .filter((exam) => new Date(exam.exam_date).getTime() < now)
        .sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime()),
    [exams, now]
  );

  return (
    <AppShell title="My Exams" description="Midterm and final examination schedule">
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load exams" message={error} onRetry={loadExams} />
        ) : null}

        {loading ? (
          <SkeletonLoader rows={5} />
        ) : (
          <>
            <section className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Upcoming Exams</h2>
                  <p className="text-sm text-[#6B7280]">Exams scheduled for a future date</p>
                </div>
                <Button variant="secondary" onClick={loadExams} disabled={loading}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
              {upcomingExams.length ? (
                <div className="grid gap-3">
                  {upcomingExams.map((exam) => (
                    <div key={exam.exam_id} className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#F5DBE5] text-[#701F3D]">
                            <CalendarDays className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#111827]">
                              {exam.course.course_name} ({exam.course.course_code})
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              {new Date(exam.exam_date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge tone="maroon">{exam.exam_type}</Badge>
                          <span className="text-xs font-semibold text-[#6B7280]">{exam.total_marks} marks</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No upcoming exams" message="Exams scheduled for a future date will appear here." />
              )}
            </section>

            <section className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font black">Completed Exams</h2>
                  <p className="text-sm text-[#6B7280]">Past examinations</p>
                </div>
              </div>
              {completedExams.length ? (
                <div className="grid gap-3">
                  {completedExams.map((exam) => (
                    <div key={exam.exam_id} className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gray-100 text-[#6B7280]">
                            <FileText className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#111827]">
                              {exam.course.course_name} ({exam.course.course_code})
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              {new Date(exam.exam_date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge tone="gray">{exam.exam_type}</Badge>
                          <span className="text-xs font-semibold text-[#6B7280]">{exam.total_marks} marks</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No completed exams" message="Past examinations will appear here." />
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
