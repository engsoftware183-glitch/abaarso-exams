"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, User, BookOpen, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, SkeletonLoader } from "@/components/ui/StateBlocks";
import { apiClient } from "@/lib/api-client";

type StudentInfo = {
  student_id: number;
  full_name: string;
  roll_no: string;
  email: string;
  phone: string | null;
  address: string | null;
  gender: string;
  academic: { year: string };
  faculty: { faculty_name: string };
  department: { department_name: string };
  semester: { semester_name: string };
};

export default function StudentProfilePage() {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get<{ success: boolean; students: StudentInfo[] }>("/api/students");
      const studentList = response.students ?? [];
      setStudent(studentList[0] ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  return (
    <AppShell title="My Profile" description="Your personal and academic information">
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load profile" message={error} onRetry={loadProfile} />
        ) : null}

        {loading ? (
          <SkeletonLoader rows={4} />
        ) : student ? (
          <>
            <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[#F5DBE5] text-2xl font-black text-[#701F3D]">
                  {student.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#111827]">{student.full_name}</h2>
                  <p className="text-sm text-[#6B7280]">{student.roll_no}</p>
                  <Badge tone="maroon">{student.gender}</Badge>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <h3 className="text-base font-black text-[#111827]">Personal Information</h3>
                <div className="mt-4 grid gap-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 text-[#6B7280]" />
                    <div>
                      <p className="text-xs font-bold text-[#6B7280]">Email</p>
                      <p className="text-sm font-semibold text-[#111827]">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 text-[#6B7280]" />
                    <div>
                      <p className="text-xs font-bold text-[#6B7280]">Phone</p>
                      <p className="text-sm font-semibold text-[#111827]">{student.phone ?? "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-4 w-4 text-[#6B7280]" />
                    <div>
                      <p className="text-xs font-bold text-[#6B7280]">Address</p>
                      <p className="text-sm font-semibold text-[#111827]">{student.address ?? "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <h3 className="text-base font-black text-[#111827]">Academic Information</h3>
                <div className="mt-4 grid gap-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-[#6B7280]" />
                    <div>
                      <p className="text-xs font-bold text-[#6B7280]">Academic Year</p>
                      <p className="text-sm font-semibold text-[#111827]">{student.academic.year}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="mt-0.5 h-4 w-4 text-[#6B7280]" />
                    <div>
                      <p className="text-xs font-bold text-[#6B7280]">Faculty</p>
                      <p className="text-sm font-semibold text-[#111827]">{student.faculty.faculty_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="mt-0.5 h-4 w-4 text-[#6B7280]" />
                    <div>
                      <p className="text-xs font-bold text-[#6B7280]">Department</p>
                      <p className="text-sm font-semibold text-[#111827]">{student.department.department_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <EmptyState title="No profile found" message="Student profile could not be loaded." />
        )}
      </div>
    </AppShell>
  );
}
