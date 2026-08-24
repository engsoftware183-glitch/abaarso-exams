import { AppShell } from "@/components/layout/AppShell";
import { ReactNode } from "react";

interface ReportShellProps {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function ReportShell({ title, description, children, actions }: ReportShellProps) {
  return (
    <AppShell title={title}>
      <div className="flex h-full flex-col p-4 md:p-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-2 text-2xl font-black text-[#111827]">{title}</h1>
            <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        <main className="flex-1 space-y-6">
          {children}
        </main>
      </div>
    </AppShell>
  );
}
