"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, SkeletonLoader } from "@/components/ui/StateBlocks";
import { apiClient } from "@/lib/api-client";

type Course = {
  course_id: number;
  course_code: string;
  course_name: string;
  credit_hours: number;
  description: string | null;
  department: { department_name: string };
  semester: { semester_name: string };
};

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCourses() {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get<{ success: boolean; count: number; courses: Course[] }>("/api/courses");
      setCourses(response.courses ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load courses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCourses();
  }, []);

  return (
    <AppShell title="My Courses" description="Courses enrolled in your department">
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load courses" message={error} onRetry={loadCourses} />
        ) : null}

        {loading ? (
          <SkeletonLoader rows={5} />
        ) : courses.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <div key={course.course_id} className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5DBE5] text-[#701F3D]">
                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <Badge tone="maroon">{course.credit_hours} CH</Badge>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-bold text-[#111827]">{course.course_code}</p>
                  <p className="text-base font-black text-[#111827]">{course.course_name}</p>
                  <p className="text-xs text-[#6B7280]">{course.department.department_name}</p>
                  <p className="text-xs text-[#6B7280]">{course.semester.semester_name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No courses found" message="Courses assigned to your department will appear here." />
        )}
      </div>
    </AppShell>
  );
}
