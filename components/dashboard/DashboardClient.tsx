"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CalendarClock, FileText, GraduationCap, ScrollText, Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { dashboardFallback } from "@/lib/dashboard-fallback";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingSpinner, SkeletonLoader } from "@/components/ui/StateBlocks";
import { FileUpload } from "@/components/uploads/FileUpload";
import { ImageUpload } from "@/components/uploads/ImageUpload";
import { SpreadsheetUpload } from "@/components/uploads/SpreadsheetUpload";
import { useToast } from "@/components/ui/ToastProvider";

type DashboardStats = typeof dashboardFallback.stats;
type DashboardState = {
  stats: DashboardStats;
  source: "api" | "fallback";
};

type CountResponse = {
  count?: number;
  total?: number;
  students?: unknown[];
  courses?: unknown[];
  faculties?: unknown[];
  departments?: unknown[];
  exams?: unknown[];
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
  { key: "exams", label: "Total Exams", icon: CalendarClock },
  { key: "published", label: "Published Results", icon: ScrollText },
  { key: "draft", label: "Draft Results", icon: AlertTriangle },
  { key: "averageCgpa", label: "Average CGPA", icon: GraduationCap },
] as const;

const pieColors = ["#16A34A", "#2563EB", "#D97706", "#64748B", "#DC2626"];

export function DashboardClient() {
  const { showToast } = useToast();
  const [state, setState] = useState<DashboardState>({ stats: dashboardFallback.stats, source: "fallback" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [students, courses, faculties, departments, exams] = await Promise.all([
        apiClient.get<CountResponse>("/api/students"),
        apiClient.get<CountResponse>("/api/courses"),
        apiClient.get<CountResponse>("/api/faculties"),
        apiClient.get<CountResponse>("/api/departments"),
        apiClient.get<CountResponse>("/api/exams"),
      ]);

      setState({
        source: "api",
        stats: {
          students: readCount(students, "students"),
          courses: readCount(courses, "courses"),
          faculties: readCount(faculties, "faculties"),
          departments: readCount(departments, "departments"),
          exams: readCount(exams, "exams"),
          published: dashboardFallback.stats.published,
          draft: dashboardFallback.stats.draft,
          averageCgpa: dashboardFallback.stats.averageCgpa,
        },
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Dashboard API data is unavailable.");
      setState({ stats: dashboardFallback.stats, source: "fallback" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const facultyData = useMemo(() => dashboardFallback.studentsByFaculty, []);

  return (
    <div className="grid gap-6">
      {error ? (
        <ErrorState
          title="Using dashboard fallback data"
          message={`${error} Sign in with a valid account to load protected API data.`}
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
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#DCFCE7] text-[#15803D]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <Badge tone={state.source === "api" ? "green" : "amber"}>{state.source === "api" ? "Live" : "Fallback"}</Badge>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardFallback.examActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="exams" fill="#16A34A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Students by Faculty</h2>
          <p className="text-sm text-[#6B7280]">Distribution snapshot</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={facultyData} innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                  {facultyData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            {["Register student", "Create exam", "Generate result", "Search transcript"].map((action) => (
              <Button key={action} variant="secondary" className="justify-start" onClick={() => showToast(`${action} module will be added after this milestone is approved.`)}>
                {action}
              </Button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Draft Results Waiting</h2>
          <div className="mt-4 grid gap-3">
            {["Database Systems", "Calculus II", "Academic Writing"].map((course) => (
              <div key={course} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3">
                <span className="text-sm font-semibold">{course}</span>
                <Badge tone="amber">Draft</Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Missing Exam Marks</h2>
          <div className="mt-4">
            <EmptyState title="No urgent missing marks" message="Missing mark review will populate from the examination module when endpoints are connected." />
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
