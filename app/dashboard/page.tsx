import { AppShell } from "@/components/layout/AppShell";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function DashboardPage() {
  return (
    <AppShell title="Administration Dashboard" description="Live academic, examination, result, and transcript overview for ABAARSO TECH UNIVERSITY.">
      <DashboardClient />
    </AppShell>
  );
}
