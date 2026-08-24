"use client";

import { useEffect, useState } from "react";
import { FileDown, Printer } from "lucide-react";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonLoader } from "@/components/ui/StateBlocks";
import { apiClient } from "@/lib/api-client";

type CourseData = {
  course_code: string;
  course_name: string;
  credit_hours: number;
  attendance_mark: number;
  assignment_mark: number;
  quiz_mark: number;
  midterm_mark: number;
  final_mark: number;
  total_marks: number;
  grade: string | null;
  gpa: number;
};

type SemesterData = {
  semester_id: number;
  semester_name: string;
  courses: CourseData[];
  total_credit_hours: number;
  semester_gpa: number;
};

type TranscriptResponse = {
  success: boolean;
  student: {
    student_id: number;
    full_name: string;
    roll_no: string;
    email: string;
    faculty: string;
    department: string;
    academic_year: string;
  };
  semesters: SemesterData[];
  summary: {
    total_semesters: number;
    total_courses: number;
    total_credit_hours: number;
    cgpa: number;
  };
};

export default function StudentTranscriptPage() {
  const [data, setData] = useState<TranscriptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTranscript() {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get<TranscriptResponse>("/api/transcripts");
      setData(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load transcript.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTranscript();
  }, []);

  function handlePrint() {
    window.print();
  }

  function handleDownloadPdf() {
    const student = data?.student;
    if (!student) return;
    const url = `/api/transcripts/pdf?student_id=${student.student_id}`;
    window.open(url, "_blank");
  }

  return (
    <AppShell title="My Transcript" description="Official academic transcript">
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load transcript" message={error} onRetry={loadTranscript} />
        ) : null}

        {loading ? (
          <SkeletonLoader rows={6} />
        ) : data ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white">
                  <Image src="/images/atu-logo.png" alt="ATU logo" fill className="object-contain" priority />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-[#701F3D]">ABAARSO TECH UNIVERSITY</p>
                  <p className="text-base font-black text-[#111827]">Academic Transcript</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button onClick={handleDownloadPdf}>
                  <FileDown className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>

            <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-[#6B7280]">Student Name</p>
                  <p className="text-sm font-semibold text-[#111827]">{data.student.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280]">Roll Number</p>
                  <p className="text-sm font-semibold text-[#111827]">{data.student.roll_no}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280]">Faculty</p>
                  <p className="text-sm font-semibold text-[#111827]">{data.student.faculty}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280]">Department</p>
                  <p className="text-sm font-semibold text-[#111827]">{data.student.department}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280]">Academic Year</p>
                  <p className="text-sm font-semibold text-[#111827]">{data.student.academic_year}</p>
                </div>
              </div>
            </section>

            {data.semesters.map((semester) => (
              <section key={semester.semester_id} className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-black text-[#111827]">{semester.semester_name}</h3>
                  <Badge tone="maroon">
                    GPA {Number(semester.semester_gpa).toFixed(2)}
                  </Badge>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                      <tr>
                        <th className="px-4 py-3 font-black">Course Code</th>
                        <th className="px-4 py-3 font-black">Course Name</th>
                        <th className="px-4 py-3 font-black text-center">Credit Hours</th>
                        <th className="px-4 py-3 font-black text-center">Attendance</th>
                        <th className="px-4 py-3 font-black text-center">Assignment</th>
                        <th className="px-4 py-3 font-black text-center">Quiz</th>
                        <th className="px-4 py-3 font-black text-center">Midterm</th>
                        <th className="px-4 py-3 font-black text-center">Final</th>
                        <th className="px-4 py-3 font-black text-right">Total</th>
                        <th className="px-4 py-3 font-black text-center">Grade</th>
                        <th className="px-4 py-3 font-black text-right">GPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {semester.courses.map((course, index) => (
                        <tr key={index} className="hover:bg-[#F9FAFB]">
                          <td className="px-4 py-3 font-semibold text-[#111827]">{course.course_code}</td>
                          <td className="px-4 py-3 font-semibold text-[#111827]">{course.course_name}</td>
                          <td className="px-4 py-3 text-center font-semibold text-[#111827]">{course.credit_hours}</td>
                          <td className="px-4 py-3 text-center font-semibold text-[#111827]">{course.attendance_mark}</td>
                          <td className="px-4 py-3 text-center font-semibold text-[#111827]">{course.assignment_mark}</td>
                          <td className="px-4 py-3 text-center font-semibold text-[#111827]">{course.quiz_mark}</td>
                          <td className="px-4 py-3 text-center font-semibold text-[#111827]">{course.midterm_mark}</td>
                          <td className="px-4 py-3 text-center font-semibold text-[#111827]">{course.final_mark}</td>
                          <td className="px-4 py-3 text-right font-semibold text-[#111827]">{course.total_marks}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge tone="maroon">{course.grade ?? "—"}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[#111827]">{Number(course.gpa).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                  <span className="text-xs font-bold text-[#6B7280]">
                    Total Credit Hours: <span className="text-[#111827]">{semester.total_credit_hours}</span>
                  </span>
                  <span className="text-xs font-bold text-[#6B7280]">
                    Semester GPA: <span className="text-[#111827]">{Number(semester.semester_gpa).toFixed(2)}</span>
                  </span>
                </div>
              </section>
            ))}

            <section className="rounded-lg border border-[#B03060] bg-[#FBEFF3] p-5 shadow-sm">
              <h3 className="text-base font-black text-[#701F3D]">Overall Academic Summary</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-bold text-[#6B7280]">Total Semesters</p>
                  <p className="text-lg font-black text-[#111827]">{data.summary.total_semesters}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280]">Total Courses</p>
                  <p className="text-lg font-black text-[#111827]">{data.summary.total_courses}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280]">Total Credit Hours</p>
                  <p className="text-lg font-black text-[#111827]">{data.summary.total_credit_hours}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280]">CGPA</p>
                  <p className="text-lg font-black text-[#111827]">{Number(data.summary.cgpa).toFixed(2)}</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <EmptyState title="No transcript found" message="Transcript will be available once results are published." />
        )}
      </div>
    </AppShell>
  );
}
