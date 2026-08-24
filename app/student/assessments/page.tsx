"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, SkeletonLoader } from "@/components/ui/StateBlocks";
import { apiClient } from "@/lib/api-client";

type Assessment = {
  assessment_id: number;
  assignment_mark: number;
  quiz_mark: number;
  total_assessment: number;
  student: { full_name: string; roll_no: string };
  course: { course_code: string; course_name: string };
};

export default function StudentAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAssessments() {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get<{ success: boolean; total: number; assessments: Assessment[] }>("/api/assessment");
      setAssessments(response.assessments ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load assessments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAssessments();
  }, []);

  return (
    <AppShell title="My Assessments" description="Assignment and quiz marks">
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load assessments" message={error} onRetry={loadAssessments} />
        ) : null}

        {loading ? (
          <SkeletonLoader rows={5} />
        ) : assessments.length ? (
          <div className="grid gap-4">
            {assessments.map((record) => (
              <div key={record.assessment_id} className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#F5DBE5] text-[#701F3D]">
                      <Activity className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111827]">
                        {record.course.course_name} ({record.course.course_code})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#6B7280]">Assignment</p>
                      <p className="text-sm font-black text-[#111827]">{record.assignment_mark}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#6B7280]">Quiz</p>
                      <p className="text-sm font-black text-[#111827]">{record.quiz_mark}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#6B7280]">Total</p>
                      <p className="text-sm font-black text-[#111827]">{record.total_assessment}</p>
                    </div>
                    <Badge tone="maroon">Assessment</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No assessments found" message="Assessment marks will appear here once recorded." />
        )}
      </div>
    </AppShell>
  );
}
