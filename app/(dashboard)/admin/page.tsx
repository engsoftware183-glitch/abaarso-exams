"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarClock, FileCheck2, GraduationCap, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonLoader } from "@/components/ui/StateBlocks";

type AnalyticsResponse = {
  data: {
    totalStudents: number;
    totalCourses: number;
    examsConducted: number;
    publishedResults: number;
    performance: { labels: string[]; values: number[] };
    distribution: { labels: string[]; values: number[] };
  };
};

type ExamsResponse = {
  success: boolean;
  total: number;
  exams: Array<{
    exam_id: number;
    exam_type: string;
    exam_date: string;
    course: { course_name: string; course_code: string };
  }>;
};

const statCards = [
  { key: "totalStudents", label: "Total Students", icon: Users },
  { key: "totalCourses", label: "Total Courses", icon: GraduationCap },
  { key: "examsConducted", label: "Exams Conducted", icon: CalendarClock },
  { key: "publishedResults", label: "Results Published", icon: FileCheck2 },
] as const;

const pieColors = ["#B03060", "#D05382", "#90274F", "#B45309", "#701F3D"];

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse["data"] | null>(null);
  const [exams, setExams] = useState<ExamsResponse["exams"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [analyticsResponse, examsResponse] = await Promise.all([
        apiClient.get<AnalyticsResponse>("/api/analytics"),
        apiClient.get<ExamsResponse>("/api/exams"),
      ]);

      setAnalytics(analyticsResponse.data);
      setExams(examsResponse.exams);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load dashboard data.");
      setAnalytics(null);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const performanceData = useMemo(
    () =>
      (analytics?.performance.labels ?? []).map((label, index) => ({
        semester: label,
        gpa: analytics?.performance.values[index] ?? 0,
      })),
    [analytics]
  );

  const distributionData = useMemo(
    () =>
      (analytics?.distribution.labels ?? []).map((label, index) => ({
        name: label,
        value: analytics?.distribution.values[index] ?? 0,
      })),
    [analytics]
  );

  const upcomingExams = useMemo(() => {
    const now = Date.now();
    return exams
      .filter((exam) => new Date(exam.exam_date).getTime() >= now)
      .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
      .slice(0, 5);
  }, [exams]);

  return (
    <AppShell
      title="Admin Dashboard"
      description="Live examination analytics for ABAARSO TECH UNIVERSITY, sourced directly from the academic database."
    >
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load analytics" message={error} onRetry={loadDashboard} />
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <div className="sm:col-span-2 xl:col-span-4">
              <SkeletonLoader rows={2} />
            </div>
          ) : (
            statCards.map((card) => {
              const Icon = card.icon;
              const value = analytics ? analytics[card.key] : 0;
              return (
                <article key={card.key} className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#F5DBE5] text-[#701F3D]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <Badge tone={analytics ? "green" : "amber"}>{analytics ? "Live" : "Unavailable"}</Badge>
                  </div>
                  <p className="mt-4 text-sm font-bold text-[#6B7280]">{card.label}</p>
                  <p className="mt-1 text-3xl font-black text-[#111827]">{value}</p>
                </article>
              );
            })
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Average GPA by Semester</h2>
                <p className="text-sm text-[#6B7280]">Published results only</p>
              </div>
              <Button variant="secondary" onClick={loadDashboard} disabled={loading}>
                Refresh
              </Button>
            </div>
            <div className="mt-6 h-72">
              {performanceData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="semester" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="gpa" stroke="#B03060" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No performance data"
                  message="Publish results with a GPA to see average GPA by semester."
                />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Grade Distribution</h2>
            <p className="text-sm text-[#6B7280]">Published results by grade</p>
            <div className="mt-6 h-72">
              {distributionData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                      {distributionData.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No grade data" message="Results with a grade will appear here." />
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Upcoming Exams</h2>
          <p className="text-sm text-[#6B7280]">From the examination schedule</p>
          <div className="mt-4 grid gap-3">
            {loading ? (
              <SkeletonLoader rows={3} />
            ) : upcomingExams.length ? (
              upcomingExams.map((exam) => (
                <div
                  key={exam.exam_id}
                  className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {exam.course.course_name} ({exam.course.course_code})
                    </p>
                    <p className="text-xs text-[#6B7280]">{new Date(exam.exam_date).toLocaleDateString()}</p>
                  </div>
                  <Badge tone="maroon">{exam.exam_type}</Badge>
                </div>
              ))
            ) : (
              <EmptyState title="No upcoming exams" message="Exams scheduled for a future date will appear here." />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
