"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarClock, FileText, GraduationCap, ScrollText, Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingSpinner, SkeletonLoader } from "@/components/ui/StateBlocks";
import { FileUpload } from "@/components/uploads/FileUpload";
import { ImageUpload } from "@/components/uploads/ImageUpload";
import { SpreadsheetUpload } from "@/components/uploads/SpreadsheetUpload";


type DashboardStats = {
  students: number;
  courses: number;
  faculties: number;
  departments: number;
  exams: number;
  published: number;
};
type DashboardState = {
  stats: DashboardStats;
  performance: { labels: string[]; values: number[] };
  distribution: { labels: string[]; values: number[] };
  source: "api" | "error" | "idle";
};

// Honest zeroed baseline - the dashboard never fabricates records. The
// real database values replace these only when the API responds.
const emptyStats: DashboardStats = {
  students: 0,
  courses: 0,
  faculties: 0,
  departments: 0,
  exams: 0,
  published: 0,
};

type CountResponse = {
  count?: number;
  total?: number;
  faculties?: unknown[];
  departments?: unknown[];
};

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

function readCount(response: CountResponse, key: keyof CountResponse) {
  const value = response[key];
  if (typeof response.count === "number") return response.count;
  if (typeof response.total === "number") return response.total;
  if (Array.isArray(value)) return value.length;
  return 0;
}

const statCards = [
  { key: "students", label: "Total Students", icon: Users },
  { key: "courses", label: "Total Courses", icon: GraduationCap },
  { key: "faculties", label: "Total Faculties", icon: FileText },
  { key: "departments", label: "Total Departments", icon: FileText },
  { key: "exams", label: "Exams Conducted", icon: CalendarClock },
  { key: "published", label: "Published Results", icon: ScrollText },
] as const;

const pieColors = ["#B03060", "#D05382", "#90274F", "#B45309", "#701F3D"];

export function DashboardClient() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({
    stats: emptyStats,
    performance: { labels: [], values: [] },
    distribution: { labels: [], values: [] },
    source: "idle",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [faculties, departments, analytics] = await Promise.all([
        apiClient.get<CountResponse>("/api/faculties"),
        apiClient.get<CountResponse>("/api/departments"),
        apiClient.get<AnalyticsResponse>("/api/analytics"),
      ]);

      setState({
        source: "api",
        stats: {
          students: analytics.data.totalStudents,
          courses: analytics.data.totalCourses,
          faculties: readCount(faculties, "faculties"),
          departments: readCount(departments, "departments"),
          exams: analytics.data.examsConducted,
          published: analytics.data.publishedResults,
        },
        performance: analytics.data.performance,
        distribution: analytics.data.distribution,
      });
    } catch (requestError) {
      // No mock data fallback: on failure the dashboard keeps zeroed
      // stats and shows honest empty states instead of fabricated
      // university records.
      setError(requestError instanceof Error ? requestError.message : "Dashboard API data is unavailable.");
      setState({
        stats: emptyStats,
        performance: { labels: [], values: [] },
        distribution: { labels: [], values: [] },
        source: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const distributionData = useMemo(
    () => state.distribution.labels.map((label, index) => ({ name: label, value: state.distribution.values[index] })),
    [state.distribution]
  );
  const performanceData = useMemo(
    () => state.performance.labels.map((label, index) => ({ semester: label, gpa: state.performance.values[index] })),
    [state.performance]
  );

  return (
    <div className="grid gap-6">
      {error ? (
        <ErrorState
          title="Dashboard data unavailable"
          message={`${error} Refresh to try again.`}
          onRetry={loadDashboard}
        />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <div className="sm:col-span-2 xl:col-span-4"><SkeletonLoader rows={2} /></div>
        ) : (
          statCards.map((card) => {
            const Icon = card.icon;
            const value = state.stats[card.key];
            return (
              <article key={card.key} className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#F5DBE5] text-[#701F3D]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <Badge tone={state.source === "api" ? "green" : "amber"}>
                    {state.source === "api" ? "Live" : state.source === "error" ? "Unavailable" : "Loading"}
                  </Badge>
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
              <h2 className="text-lg font-black">Monthly Exam Activity</h2>
              <p className="text-sm text-[#6B7280]">Exam creation activity by month</p>
            </div>
            {loading ? <LoadingSpinner label="Refreshing" /> : <Button variant="secondary" onClick={loadDashboard}>Refresh</Button>}
          </div>
          <div className="mt-6 h-72">
            {performanceData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="semester" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="gpa" fill="#B03060" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No performance data" message="Publish results with a GPA to see average GPA by semester." />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Grade Distribution</h2>
          <p className="text-sm text-[#6B7280]">Results grouped by grade</p>
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

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            {[
              { label: "Register student", href: "/students/new" },
              { label: "Create exam", href: "/exams/new" },
              { label: "Generate result", href: "/results/generate" },
              { label: "Search transcript", href: "/transcripts/search" }
            ].map((action) => (
              <Button key={action.label} variant="secondary" className="justify-start" onClick={() => router.push(action.href)}>
                {action.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Draft Results Waiting</h2>
          <div className="mt-4">
            <EmptyState
              title="No draft results"
              message="Draft results awaiting review will appear here once results are generated."
            />
          </div>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Missing Exam Marks</h2>
          <div className="mt-4">
            <EmptyState title="No urgent missing marks" message="No pending missing mark reviews at this time." />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-black">Reusable Upload Components</h2>
          <p className="mt-1 text-sm text-[#6B7280]">Frontend controls are ready. Backend upload routes were not created in this milestone.</p>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <ImageUpload label="Student profile photo" />
          <FileUpload label="Course supporting document" />
          <SpreadsheetUpload label="Students bulk upload" />
        </div>
      </section>
    </div>
  );
}
