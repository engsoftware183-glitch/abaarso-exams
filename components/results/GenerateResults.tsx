"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonLoader } from "@/components/ui/StateBlocks";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";

type SemesterOption = {
  semester_id: number;
  semester_name: string;
};

type StudentOption = {
  student_id: number;
  full_name: string;
  roll_no: string;
  semester_id: number;
  department_id: number;
};

type CourseOption = {
  course_id: number;
  course_name: string;
  course_code: string;
  semester_id: number;
  department_id: number;
};

type GeneratedResult = {
  result_id: number;
  total_marks: number;
  grade: string | null;
  gpa: number;
  remarks: string | null;
  status: "DRAFT" | "PUBLISHED";
  student: { full_name: string; roll_no: string };
  course: { course_name: string; course_code: string };
  semester: { semester_name: string };
};

const selectClass =
  "h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm focus:border-[#B03060] disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]";

function formatError(requestError: unknown): string {
  if (requestError instanceof ApiClientError) {
    return requestError.payload?.message ?? requestError.message;
  }
  return requestError instanceof Error ? requestError.message : "Something went wrong";
}

export function GenerateResults() {
  const user = useMemo(() => getStoredUser(), []);
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [semesterId, setSemesterId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [semestersResponse, studentsResponse, coursesResponse] = await Promise.all([
        apiClient.get<{ semesters: SemesterOption[] }>("/api/semesters"),
        apiClient.get<{ students: StudentOption[] }>("/api/students"),
        apiClient.get<{ courses: CourseOption[] }>("/api/courses"),
      ]);

      setSemesters(semestersResponse.semesters ?? []);
      setStudents(studentsResponse.students ?? []);
      setCourses(coursesResponse.courses ?? []);
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedStudent = students.find((s) => String(s.student_id) === studentId);

  // Only students enrolled in the chosen semester can get a result for it.
  const semesterStudents = students.filter((s) => String(s.semester_id) === semesterId);

  // Only courses offered in the chosen semester - and the student's own
  // department - can have a result generated.
  const semesterCourses = courses.filter(
    (c) =>
      String(c.semester_id) === semesterId &&
      (!selectedStudent || c.department_id === selectedStudent.department_id)
  );

  function changeSemester(next: string) {
    setSemesterId(next);
    setStudentId("");
    setCourseId("");
    setResult(null);
  }

  function changeStudent(next: string) {
    setStudentId(next);
    setCourseId("");
    setResult(null);
  }

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    if (!semesterId || !studentId || !courseId) {
      toast.error("Select a semester, student, and course first.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post<{ result: GeneratedResult }>("/api/results", {
        student_id: Number(studentId),
        course_id: Number(courseId),
        semester_id: Number(semesterId),
        status,
      });

      setResult(response.result);
      toast.success("Result generated successfully");
    } catch (requestError) {
      toast.error(formatError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Generate Results"
      description="Calculate a student's result from their attendance, assessment, and exam marks."
    >
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load data" message={error} onRetry={() => void load()} />
        ) : null}

        {!isManager ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <EmptyState
              title="Manager access required"
              message="Only administrators and super administrators can generate results."
            />
          </div>
        ) : loading ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <SkeletonLoader rows={4} />
          </div>
        ) : (
          <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <form className="grid gap-5" onSubmit={generate} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-bold text-[#111827]">
                  Semester
                  <select
                    className={selectClass}
                    value={semesterId}
                    onChange={(event) => changeSemester(event.target.value)}
                    required
                  >
                    <option value="">
                      {semesters.length ? "Select semester" : "No semesters available"}
                    </option>
                    {semesters.map((semester) => (
                      <option key={semester.semester_id} value={semester.semester_id}>
                        {semester.semester_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm font-bold text-[#111827]">
                  Student
                  <select
                    className={selectClass}
                    value={studentId}
                    disabled={!semesterId}
                    onChange={(event) => changeStudent(event.target.value)}
                    required
                  >
                    <option value="">
                      {!semesterId
                        ? "Select a semester first"
                        : semesterStudents.length
                          ? "Select student"
                          : "No students in this semester"}
                    </option>
                    {semesterStudents.map((student) => (
                      <option key={student.student_id} value={student.student_id}>
                        {student.full_name} ({student.roll_no})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm font-bold text-[#111827]">
                  Course
                  <select
                    className={selectClass}
                    value={courseId}
                    disabled={!studentId}
                    onChange={(event) => setCourseId(event.target.value)}
                    required
                  >
                    <option value="">
                      {!studentId
                        ? "Select a student first"
                        : semesterCourses.length
                          ? "Select course"
                          : "No courses for this student in this semester"}
                    </option>
                    {semesterCourses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.course_name} ({course.course_code})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm font-bold text-[#111827]">
                  Status
                  <select
                    className={selectClass}
                    value={status}
                    onChange={(event) => setStatus(event.target.value as "DRAFT" | "PUBLISHED")}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:justify-end">
                <Button variant="secondary" type="button" onClick={() => void load()} disabled={submitting}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button type="submit" disabled={submitting || !semesterId || !studentId || !courseId}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <GraduationCap className="h-4 w-4" />
                      Generate Result
                    </>
                  )}
                </Button>
              </div>
            </form>

            <p className="mt-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs leading-5 text-[#6B7280]">
              Total marks are calculated as attendance + assignment + quiz + midterm + final. If a result already exists
              for this student and course, generation is refused — edit or delete the existing result first.
            </p>
          </section>
        )}

        {result ? (
          <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black">Result generated</h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {result.student.full_name} ({result.student.roll_no}) — {result.course.course_name} (
                  {result.course.course_code}) — {result.semester.semester_name}
                </p>
              </div>
              <Badge tone={result.status === "PUBLISHED" ? "green" : "amber"}>{result.status}</Badge>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">Total Marks</p>
                <p className="mt-2 text-2xl font-black">{result.total_marks}</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">Grade</p>
                <p className="mt-2 text-2xl font-black text-[#90274F]">{result.grade ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">GPA</p>
                <p className="mt-2 text-2xl font-black">{Number(result.gpa).toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">Remarks</p>
                <p className="mt-2 text-sm font-bold text-[#111827]">{result.remarks ?? "—"}</p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setResult(null);
                  setCourseId("");
                  setStudentId("");
                }}
              >
                Generate another
              </Button>
            </div>
          </section>
        ) : null}

        {!loading && !error && semesters.length === 0 ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <EmptyState
              title="No semesters available"
              message="Create an academic year and semester before generating results."
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
