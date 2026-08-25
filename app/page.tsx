import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileBadge2,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

const features = [
  {
    title: "Comprehensive Exam Management",
    description: "Create, schedule and manage examinations with ease and accuracy.",
    icon: GraduationCap,
  },
  {
    title: "Smart Evaluation & Grading",
    description: "Evaluate student performance efficiently with automated tools.",
    icon: ClipboardCheck,
  },
  {
    title: "Real-time Results & Analytics",
    description: "Access instant results and insights to drive better decisions.",
    icon: BarChart3,
  },
  {
    title: "Academic Transcripts",
    description: "Generate official transcripts quickly and securely.",
    icon: FileBadge2,
  },
];

const overviewItems = [
  { value: "2,450+", label: "Students", icon: Users },
  { value: "320+", label: "Courses", icon: BookOpen },
  { value: "86+", label: "Exams Conducted", icon: ClipboardCheck },
  { value: "95%", label: "System Reliability", icon: Trophy },
  { value: "100%", label: "Data Security", icon: ShieldCheck },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fffdfd] text-[#10192d]">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(176,48,96,.45) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="absolute -right-[260px] -top-[300px] hidden h-[760px] w-[820px] rounded-full bg-gradient-to-br from-[#751338] via-[#a41e4e] to-[#c22e65] lg:block" />
          <div className="absolute left-[30%] top-0 hidden h-full w-64 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-md lg:block" />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-5 pb-5 pt-5 sm:px-8 lg:px-10 xl:px-12">
          <div className="grid items-center gap-7 lg:min-h-[545px] lg:grid-cols-[0.82fr_1.18fr] xl:gap-3">
            <div className="relative z-20 mx-auto w-full max-w-[500px] lg:mx-0">
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="mb-4 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <div className="relative h-[112px] w-[112px] shrink-0 sm:h-[125px] sm:w-[125px]">
                    <Image
                      src="/images/atu-logo.jpg"
                      alt="Abaarso Tech University logo"
                      fill
                      priority
                      sizes="125px"
                      className="object-contain"
                    />
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-[#efd3de] bg-[#fff4f7] px-4 py-2 text-xs font-bold text-[#a51f50] shadow-sm sm:text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Smart â€¢ Secure â€¢ Seamless</span>
                  </div>
                </div>

                <p className="text-sm font-extrabold tracking-[0.11em] text-[#941a46] sm:text-base">
                  ABAARSO TECH UNIVERSITY
                </p>

                <div className="mt-3 h-[3px] w-12 rounded-full bg-[#b03060]" />

                <h1 className="mt-5 max-w-[470px] text-[40px] font-black leading-[0.98] tracking-[-0.04em] sm:text-[48px] lg:text-[50px] xl:text-[54px]">
                  Examination
                  <span className="block">Management</span>
                  <span className="block">System</span>
                </h1>

                <p className="mt-5 max-w-[470px] text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  A complete digital solution to manage examinations efficiently,
                  evaluate performance accurately, and deliver academic excellence.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-800 lg:justify-start">
                  {["Secure Access", "Reliable System", "Academic Integrity"].map(
                    (item) => (
                      <div key={item} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 fill-[#b03060] text-white" />
                        <span>{item}</span>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-6 w-full max-w-[330px]">
                  <Link
                    href="/login"
                    className="group flex min-h-[50px] w-full items-center justify-between rounded-[16px] bg-gradient-to-r from-[#9e1b49] to-[#c02c62] px-5 text-sm font-bold text-white shadow-[0_14px_32px_rgba(176,48,96,.24)] transition duration-300 hover:-translate-y-0.5 hover:from-[#88163d] hover:to-[#a92355] focus:outline-none focus:ring-4 focus:ring-[#b03060]/25"
                  >
                    <span>Sign In to Your Account</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#b03060] transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>

                  <p className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-slate-500 lg:justify-start">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Secure login for students, faculty and administrators
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mx-auto w-full max-w-[820px]">
              <div className="relative hidden min-h-[500px] items-center justify-center lg:flex">
                <div className="absolute inset-x-16 bottom-5 h-20 rounded-full bg-black/15 blur-[48px]" />

                <Image
                  src="/images/exams-hero-visual.png"
                  alt="Examination management dashboard with academic books, graduation cap, answer sheet and security shield"
                  width={1011}
                  height={650}
                  priority
                  sizes="(min-width: 1280px) 790px, 54vw"
                  className="relative z-10 h-auto w-full max-w-[790px] object-contain drop-shadow-[0_20px_34px_rgba(34,8,18,.2)]"
                />
              </div>

              <div className="relative mt-7 lg:hidden">
                <Image
                  src="/images/exams-hero-visual.png"
                  alt="Examination management system visual preview"
                  width={1011}
                  height={650}
                  priority
                  sizes="100vw"
                  className="relative z-10 h-auto w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 pb-5">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10 xl:px-12">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group min-h-[150px] rounded-[18px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.06)] transition duration-300 hover:-translate-y-1 hover:border-[#b03060]/25 hover:shadow-[0_16px_34px_rgba(176,48,96,.1)]"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7e3eb] text-[#a51f50] transition group-hover:bg-[#b03060] group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </div>

                  <h2 className="text-base font-extrabold leading-5 tracking-[-0.02em]">
                    {feature.title}
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 pb-5 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1340px] overflow-hidden rounded-[18px] bg-gradient-to-r from-[#76163a] via-[#991d4b] to-[#bd2f65] shadow-[0_14px_38px_rgba(122,22,59,.18)]">
          <div className="grid divide-y divide-white/15 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
            {overviewItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex min-h-[82px] items-center justify-center gap-3 px-4 py-4 text-white"
                >
                  <Icon className="h-7 w-7 shrink-0 text-white/95" strokeWidth={1.7} />
                  <div>
                    <p className="text-xl font-black tracking-tight">{item.value}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-white/85">
                      {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-5 py-4 text-center sm:px-8 md:flex-row md:text-left lg:px-10 xl:px-12">
          <div className="flex max-w-[300px] items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f8e6ed] text-[#a51f50]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-xs leading-5 text-slate-600">
              Built with security, designed for education, driven by excellence.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#f8e6ed] text-[#a51f50]">
              <GraduationCap className="h-4 w-4" />
            </div>
            <p className="text-xs text-slate-500">
              Â© 2026 Abaarso Tech University. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <LockKeyhole className="h-4 w-4 text-[#a51f50]" />
            <span>Secure Academic Platform</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
