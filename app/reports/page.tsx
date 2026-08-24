"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Users, BookOpen, FileText, CheckCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalExams: number;
  publishedResults: number;
}

export default function ReportsDashboard() {
  return (
    <AppShell title="Reports Overview">
      <ReportsDashboardContent />
    </AppShell>
  );
}

function ReportsDashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await apiClient.get<{ success: boolean; data: DashboardStats }>("/api/reports/dashboard");
        if (response.success) {
          setStats(response.data);
        }
      } catch {
        showToast("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [showToast]);

  const cards = [
    { label: "Total Students", value: stats?.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Courses", value: stats?.totalCourses, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Exams Conducted", value: stats?.totalExams, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Published Results", value: stats?.publishedResults, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="flex h-full flex-col p-4 md:p-8">
      <header className="mb-8">
        <h1 className="mt-2 text-2xl font-black text-[#111827]">Reports Overview</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Aggregated metrics across all academic modules.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <article key={i} className="flex items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${card.bg}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#6B7280]">{card.label}</p>
              <p className="mt-1 text-3xl font-black text-[#111827]">
                {loading ? "—" : card.value?.toLocaleString() ?? 0}
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
