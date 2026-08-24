"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  PenLine,
  RefreshCw,
  ScrollText,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonLoader } from "@/components/ui/StateBlocks";
import { apiClient } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";

type StudentInfo = {
  student_id: number;
  full_name: string;
  roll_no: string;
  email: string;
  academic: { year: string };
  faculty: { faculty_name: string };
  department: { department_name: string };
  semester: { semester_name: string };
};

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
  credit_hours: number;
  department: { department_name: string };
  semester: { semester_name: string };
};

type Exam = {
  exam_id: number;
  exam_type: string;
  exam_date: string;
  total_marks: number;
  course: { course_name: string; course_code: string };
};

type Result = {
  result_id: number;
  total_marks: number;
  grade: string | null;
  gpa: number;
  status: string;
  course: { course_name: string; course_code: string };
  semester: { semester_name: string };
};

type TranscriptSummary = {
  cgpa: number;
  total_courses: number;
  total_credit_hours: number;
};

const statCards = [
  { key: "courses", label: "My Courses", icon: BookOpen },
  { key: "upcomingExams", label: "Upcoming Exams", icon: CalendarDays },
  { key: "publishedResults", label: "Published Results", icon: FileCheck2 },
  { key: "cgpa", label: "CGPA", icon: GraduationCap },
] as const;

export default function StudentDashboardPage() {
  const user = useMemo(() => getStoredUser(), []);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [studentRes, coursesRes, examsRes, resultsRes, transcriptRes] = await Promise.all([
        apiClient.get<{ success: boolean; students: StudentInfo[] }>("/api/students"),
        apiClient.get<{ success: boolean; count: number; courses: Course[] }>("/api/courses"),
        apiClient.get<{ success: boolean; total: number; exams: Exam[] }>("/api/exams"),
        apiClient.get<{ success: boolean; count: number; results: Result[] }>("/api/results"),
        apiClient.get<{ success: boolean; count: number; transcripts: TranscriptSummary[] }>("/api/transcripts"),
      ]);

      const studentList = studentRes.students ?? [];
      setStudent(studentList[0] ?? null);

      setCourses(coursesRes.courses ?? []);
      setExams(examsRes.exams ?? []);
      setResults(resultsRes.results ?? []);

      const transcriptList = transcriptRes.transcripts ?? [];
      setTranscript(transcriptList[0] ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const now = Date.now();
  const upcomingExams = useMemo(
    () =>
      exams
        .filter((exam) => new Date(exam.exam_date).getTime() >= now)
        .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
        .slice(0, 5),
    [exams, now]
  );

  const recentResults = useMemo(
    () => results.slice(0, 5),
    [results]
  );

  const stats = useMemo(() => {
    return {
      courses: courses.length,
      upcomingExams: upcomingExams.length,
      publishedResults: results.length,
      cgpa: transcript?.cgpa ?? 0,
    };
  }, [courses, upcomingExams, results, transcript]);

  return (
    <AppShell
      title="Student Dashboard"
      description={`Welcome back, ${student?.full_name ?? user?.username ?? "Student"}. Here is your academic overview.`}
    >
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load dashboard" message={error} onRetry={loadDashboard} />
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <div className="sm:col-span-2 xl:col-span-4">
              <SkeletonLoader rows={2} />
            </div>
          ) : (
            statCards.map((card) => {
              const Icon = card.icon;
              const value =
                card.key === "cgpa"
                  ? stats.cgpa > 0
                    ? stats.cgpa.toFixed(2)
                    : "—"
                  : card.key === "upcomingExams" || card.key === "publishedResults"
                    ? stats[card.key]
                    : stats[card.key];

              return (
                <article key={card.key} className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#F5DBE5] text-[#701F3D]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <Badge tone={typeof value === "string" && value === "—" ? "amber" : "green"}>
                      {typeof value === "string" && value === "—" ? "Unavailable" : "Live"}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm font-bold text-[#6B7280]">{card.label}</p>
                  <p className="mt-1 text-3xl font-black text-[#111827]">{value}</p>
                </article>
              );
            })
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Upcoming Exams</h2>
                <p className="text-sm text-[#6B7280]">Scheduled examinations</p>
              </div>
              <Button variant="secondary" onClick={loadDashboard} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
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
                      <p className="text-xs text-[#6B7280]">
                        {new Date(exam.exam_date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge tone="maroon">{exam.exam_type}</Badge>
                      <p className="text-xs text-[#6B7280] mt-1">{exam.total_marks} marks</p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No upcoming exams" message="Exams scheduled for a future date will appear here." />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Recent Published Results</h2>
            <p className="text-sm text-[#6B7280]">Latest published results</p>
            <div className="mt-4 grid gap-3">
              {loading ? (
                <SkeletonLoader rows={3} />
              ) : recentResults.length ? (
                recentResults.map((result) => (
                  <div
                    key={result.result_id}
                    className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {result.course.course_name} ({result.course.course_code})
                      </p>
                      <p className="text-xs text-[#6B7280]">{result.semester.semester_name}</p>
                    </div>
                    <div className="text-right">
                      <Badge tone="maroon">{result.grade ?? "—"}</Badge>
                      <p className="text-xs text-[#6B7280] mt-1">GPA {Number(result.gpa).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No published results" message="Published results will appear here once available." />
              )}
            </div>
          </div>
        </section>

        {student && (
          <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h2 className="text-lg font black">Academic Information</h2>
            <p className="text-sm text-[#6B7280]">Your current academic profile</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">Academic Year</p>
                <p className="mt-2 text-sm font-bold text-[#111827]">{student.academic.year}</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">Faculty</p>
                <p className="mt-2 text-sm font-bold text-[#111827]">{student.faculty.faculty_name}</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">Department</p>
                <p className="mt-2 text-sm font-bold text-[#111827]">{student.department.department_name}</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">Semester</p>
                <p className="mt-2 text-sm font-bold text-[#111827]">{student.semester.semester_name}</p>
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-[#111827]">Quick Actions</h2>
          <p className="mt-1 text-sm text-[#6B7280]">Navigate to your student portal sections</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {([
              { href: "/student/courses",     label: "My Courses",     Icon: BookOpen },
              { href: "/student/attendance",  label: "My Attendance",  Icon: UserCheck },
              { href: "/student/assessments", label: "My Assessments", Icon: ClipboardList },
              { href: "/student/exams",       label: "My Exams",       Icon: PenLine },
              { href: "/student/results",     label: "My Results",     Icon: FileCheck2 },
              { href: "/student/transcript",  label: "My Transcript",  Icon: ScrollText },
            ] as const).map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 rounded-lg border border-[#E5E7EB] p-4 text-center transition hover:border-[#B03060] hover:bg-[#F5DBE5]"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#F5DBE5] text-[#701F3D]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-xs font-bold text-[#111827]">{label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
