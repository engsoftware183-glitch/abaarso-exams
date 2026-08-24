import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { ResultStatus } from "@prisma/client";

// ======================================================
// FACULTY PERFORMANCE REPORT
// ======================================================
//
// Real relationships only: Faculty -> Department -> Course -> Result.
// Student counts come from Faculty.students (a Student enrolls
// directly under a Faculty). Course/Result metrics are derived by
// walking Department -> Course, since Course has no direct
// faculty_id column. Only PUBLISHED results count toward
// GPA/pass/fail metrics. Nothing here is invented - every number is
// either a real count or a real Prisma aggregate.

export async function GET(req: NextRequest) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);
    if (!auth.ok) return auth.response;

    // =========================================
    // QUERY PARAMS
    // =========================================

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20") || 20));

    const facultyIdParam = searchParams.get("faculty_id");
    const faculty_id =
      facultyIdParam && Number.isInteger(Number(facultyIdParam)) ? Number(facultyIdParam) : undefined;

    if (facultyIdParam && faculty_id === undefined) {
      return NextResponse.json(
        { success: false, message: "faculty_id must be a valid numeric ID" },
        { status: 400 }
      );
    }

    const where = faculty_id ? { faculty_id } : {};
    const skip = (page - 1) * limit;

    // =========================================
    // FACULTIES (PAGE)
    // =========================================

    const [total, faculties] = await Promise.all([
      prisma.faculty.count({ where }),
      prisma.faculty.findMany({
        where,
        skip,
        take: limit,
        select: {
          faculty_id: true,
          faculty_name: true,
          _count: { select: { students: true } },
        },
        orderBy: { faculty_name: "asc" },
      }),
    ]);

    const facultyIds = faculties.map((f) => f.faculty_id);

    if (facultyIds.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
        },
        { status: 200 }
      );
    }

    // =========================================
    // DEPARTMENT -> FACULTY MAP (bounded set)
    // =========================================

    const departments = await prisma.department.findMany({
      where: { faculty_id: { in: facultyIds } },
      select: { department_id: true, faculty_id: true },
    });
    const departmentToFaculty = new Map(departments.map((d) => [d.department_id, d.faculty_id]));
    const departmentIds = departments.map((d) => d.department_id);

    // =========================================
    // COURSE -> FACULTY MAP (via department)
    // =========================================

    const courses = departmentIds.length
      ? await prisma.course.findMany({
          where: { department_id: { in: departmentIds } },
          select: { course_id: true, department_id: true },
        })
      : [];
    const courseToFaculty = new Map(
      courses.map((c) => [c.course_id, departmentToFaculty.get(c.department_id) as number])
    );
    const courseIds = courses.map((c) => c.course_id);

    // course count per faculty
    const courseCountByFaculty = new Map<number, number>();
    for (const course of courses) {
      const fid = departmentToFaculty.get(course.department_id);
      if (fid === undefined) continue;
      courseCountByFaculty.set(fid, (courseCountByFaculty.get(fid) ?? 0) + 1);
    }

    // =========================================
    // PUBLISHED RESULT AGGREGATES (DB-side groupBy, per course)
    // =========================================

    const [resultCounts, resultGrades] = courseIds.length
      ? await Promise.all([
          prisma.result.groupBy({
            by: ["course_id"],
            where: { status: ResultStatus.PUBLISHED, course_id: { in: courseIds } },
            _count: { _all: true },
            _avg: { gpa: true },
          }),
          prisma.result.groupBy({
            by: ["course_id", "grade"],
            where: { status: ResultStatus.PUBLISHED, course_id: { in: courseIds } },
            _count: { _all: true },
          }),
        ])
      : [[], []];

    // fold per-course aggregates up to per-faculty
    const facultyStats = new Map<
      number,
      { publishedCount: number; sumGpaWeighted: number; passCount: number; failCount: number }
    >();

    for (const row of resultCounts) {
      const fid = courseToFaculty.get(row.course_id);
      if (fid === undefined) continue;
      const stats = facultyStats.get(fid) ?? { publishedCount: 0, sumGpaWeighted: 0, passCount: 0, failCount: 0 };
      stats.publishedCount += row._count._all;
      stats.sumGpaWeighted += (row._avg.gpa ?? 0) * row._count._all;
      facultyStats.set(fid, stats);
    }

    for (const row of resultGrades) {
      const fid = courseToFaculty.get(row.course_id);
      if (fid === undefined) continue;
      const stats = facultyStats.get(fid) ?? { publishedCount: 0, sumGpaWeighted: 0, passCount: 0, failCount: 0 };
      if (row.grade === "F") {
        stats.failCount += row._count._all;
      } else {
        stats.passCount += row._count._all;
      }
      facultyStats.set(fid, stats);
    }

    // =========================================
    // RESPONSE
    // =========================================

    const data = faculties.map((f) => {
      const stats = facultyStats.get(f.faculty_id);
      const publishedCount = stats?.publishedCount ?? 0;
      const averageGpa = publishedCount > 0 ? Number(((stats?.sumGpaWeighted ?? 0) / publishedCount).toFixed(2)) : 0;

      return {
        faculty_id: f.faculty_id,
        faculty_name: f.faculty_name,
        student_count: f._count.students,
        course_count: courseCountByFaculty.get(f.faculty_id) ?? 0,
        published_result_count: publishedCount,
        average_gpa: averageGpa,
        pass_count: stats?.passCount ?? 0,
        fail_count: stats?.failCount ?? 0,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data,
        pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("GET_FACULTY_REPORT_ERROR", error);
    return prismaErrorResponse(error, "Failed to fetch faculty performance report");
  }
}
