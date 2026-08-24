import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { ResultStatus } from "@prisma/client";

// ======================================================
// DEPARTMENT PERFORMANCE REPORT
// ======================================================
//
// Real relationships only: Department -> Faculty, Department ->
// Course -> Result. Student/course counts come directly from
// Department's own relations. Only PUBLISHED results count toward
// GPA/pass/fail metrics.

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
    const departmentIdParam = searchParams.get("department_id");

    const faculty_id =
      facultyIdParam && Number.isInteger(Number(facultyIdParam)) ? Number(facultyIdParam) : undefined;
    const department_id =
      departmentIdParam && Number.isInteger(Number(departmentIdParam)) ? Number(departmentIdParam) : undefined;

    if (facultyIdParam && faculty_id === undefined) {
      return NextResponse.json(
        { success: false, message: "faculty_id must be a valid numeric ID" },
        { status: 400 }
      );
    }
    if (departmentIdParam && department_id === undefined) {
      return NextResponse.json(
        { success: false, message: "department_id must be a valid numeric ID" },
        { status: 400 }
      );
    }

    const where = {
      ...(faculty_id ? { faculty_id } : {}),
      ...(department_id ? { department_id } : {}),
    };
    const skip = (page - 1) * limit;

    // =========================================
    // DEPARTMENTS (PAGE)
    // =========================================

    const [total, departments] = await Promise.all([
      prisma.department.count({ where }),
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        select: {
          department_id: true,
          department_name: true,
          faculty: { select: { faculty_id: true, faculty_name: true } },
          _count: { select: { students: true, courses: true } },
        },
        orderBy: { department_name: "asc" },
      }),
    ]);

    const departmentIds = departments.map((d) => d.department_id);

    if (departmentIds.length === 0) {
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
    // COURSE -> DEPARTMENT MAP (bounded set)
    // =========================================

    const courses = await prisma.course.findMany({
      where: { department_id: { in: departmentIds } },
      select: { course_id: true, department_id: true },
    });
    const courseToDepartment = new Map(courses.map((c) => [c.course_id, c.department_id]));
    const courseIds = courses.map((c) => c.course_id);

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

    const departmentStats = new Map<
      number,
      { publishedCount: number; sumGpaWeighted: number; passCount: number; failCount: number }
    >();

    for (const row of resultCounts) {
      const did = courseToDepartment.get(row.course_id);
      if (did === undefined) continue;
      const stats =
        departmentStats.get(did) ?? { publishedCount: 0, sumGpaWeighted: 0, passCount: 0, failCount: 0 };
      stats.publishedCount += row._count._all;
      stats.sumGpaWeighted += (row._avg.gpa ?? 0) * row._count._all;
      departmentStats.set(did, stats);
    }

    for (const row of resultGrades) {
      const did = courseToDepartment.get(row.course_id);
      if (did === undefined) continue;
      const stats =
        departmentStats.get(did) ?? { publishedCount: 0, sumGpaWeighted: 0, passCount: 0, failCount: 0 };
      if (row.grade === "F") {
        stats.failCount += row._count._all;
      } else {
        stats.passCount += row._count._all;
      }
      departmentStats.set(did, stats);
    }

    // =========================================
    // RESPONSE
    // =========================================

    const data = departments.map((d) => {
      const stats = departmentStats.get(d.department_id);
      const publishedCount = stats?.publishedCount ?? 0;
      const averageGpa = publishedCount > 0 ? Number(((stats?.sumGpaWeighted ?? 0) / publishedCount).toFixed(2)) : 0;

      return {
        department_id: d.department_id,
        department_name: d.department_name,
        faculty_id: d.faculty.faculty_id,
        faculty_name: d.faculty.faculty_name,
        student_count: d._count.students,
        course_count: d._count.courses,
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
    console.log("GET_DEPARTMENT_REPORT_ERROR", error);
    return prismaErrorResponse(error, "Failed to fetch department performance report");
  }
}
