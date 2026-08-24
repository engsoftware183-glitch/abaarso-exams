import { BarChart3, ClipboardList, FileBadge, LayoutDashboard, Users } from "lucide-react";

const overviewCards = [
  { icon: Users, label: "Students", value: "—" },
  { icon: ClipboardList, label: "Exams", value: "—" },
  { icon: FileBadge, label: "Results", value: "—" },
  { icon: LayoutDashboard, label: "Pending Grading", value: "—" },
];

const recentExams = ["Data Structures Final", "Database Systems Midterm", "Algorithms Final"];

export function ExamMonitorPreview() {
  return (
    <div className="w-full max-w-[560px]">
      {/* Monitor frame */}
      <div className="rounded-2xl border-[6px] border-[#1E293B] bg-[#1E293B] p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.35)] sm:border-[8px] sm:p-2">
        <div className="overflow-hidden rounded-lg bg-white">
          {/* Topbar */}
          <div className="flex items-center justify-between border-b border-[#F1F5F9] px-3 py-2 sm:px-4">
            <span className="flex items-center gap-1.5 text-[10px] font-black text-[#701F3D] sm:text-xs">
              <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
              ATU EXAMS
            </span>
            <span className="text-[9px] font-semibold text-[#94A3B8] sm:text-[10px]">Welcome, Admin</span>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="hidden w-24 shrink-0 bg-[#340E1C] px-2 py-3 sm:block">
              {["Dashboard", "Students", "Exams", "Results"].map((item, i) => (
                <div
                  key={item}
                  className={`mb-1.5 rounded-md px-2 py-1.5 text-[8px] font-semibold ${
                    i === 0 ? "bg-[#B03060] text-white" : "text-white/60"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Main dashboard content */}
            <div className="flex-1 p-3 sm:p-4">
              <p className="text-[11px] font-black text-[#0F172A] sm:text-sm">Examination Dashboard</p>

              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {overviewCards.map((card) => (
                  <div key={card.label} className="rounded-lg border border-[#F1F5F9] bg-[#FBF7F8] p-2">
                    <card.icon className="h-3 w-3 text-[#B03060]" aria-hidden="true" />
                    <p className="mt-1 text-sm font-black text-[#0F172A] sm:text-base">{card.value}</p>
                    <p className="text-[7px] font-semibold uppercase tracking-wide text-[#94A3B8] sm:text-[8px]">
                      {card.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-[#F1F5F9] p-2.5">
                  <p className="text-[8px] font-black uppercase tracking-wide text-[#0F172A] sm:text-[9px]">
                    Recent Exams
                  </p>
                  <div className="mt-1.5 space-y-1">
                    {recentExams.map((exam) => (
                      <div key={exam} className="flex items-center justify-between">
                        <span className="text-[7px] font-medium text-[#334155] sm:text-[8px]">{exam}</span>
                        <span className="h-1 w-6 rounded-full bg-[#F5DBE5]" aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden rounded-lg border border-[#F1F5F9] p-2.5 sm:block">
                  <p className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wide text-[#0F172A] sm:text-[9px]">
                    <BarChart3 className="h-3 w-3 text-[#B03060]" aria-hidden="true" />
                    Performance Overview
                  </p>
                  <div
                    className="mx-auto mt-2 h-12 w-12 rounded-full"
                    style={{
                      background: "conic-gradient(#B03060 0% 78%, #F1F5F9 78% 100%)",
                    }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monitor stand */}
      <div className="mx-auto h-4 w-16 rounded-b-md bg-[#1E293B] sm:h-5 sm:w-20" aria-hidden="true" />
      <div className="mx-auto h-1.5 w-28 rounded-full bg-[#0F172A]/80 sm:h-2 sm:w-32" aria-hidden="true" />

      <p className="mt-3 text-center text-[10px] font-medium text-[#94A3B8]">
        Sample interface preview — not live data
      </p>
    </div>
  );
}
