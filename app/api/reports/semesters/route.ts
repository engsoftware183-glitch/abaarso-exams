import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { ResultStatus } from "@prisma/client";

// ======================================================
// SEMESTER PERFORMANCE REPORT
// ======================================================
//
// Result, Course, and Student all carry semester_id directly, so no
// intermediate mapping is needed. Only PUBLISHED results count
// toward GPA/pass/fail metrics.

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

    const academicIdParam = searchParams.get("academic_id");
    const facultyIdParam = searchParams.get("faculty_id");
    const semesterIdParam = searchParams.get("semester_id");

    const academic_id =
      academicIdParam && Number.isInteger(Number(academicIdParam)) ? Number(academicIdParam) : undefined;
    const faculty_id =
      facultyIdParam && Number.isInteger(Number(facultyIdParam)) ? Number(facultyIdParam) : undefined;
    const semester_id =
      semesterIdParam && Number.isInteger(Number(semesterIdParam)) ? Number(semesterIdParam) : undefined;

    if (academicIdParam && academic_id === undefined) {
      return NextResponse.json(
        { success: false, message: "academic_id must be a valid numeric ID" },
        { status: 400 }
      );
    }
    if (facultyIdParam && faculty_id === undefined) {
      return NextResponse.json(
        { success: false, message: "faculty_id must be a valid numeric ID" },
        { status: 400 }
      );
    }
    if (semesterIdParam && semester_id === undefined) {
      return NextResponse.json(
        { success: false, message: "semester_id must be a valid numeric ID" },
        { status: 400 }
      );
    }

    const where = {
      ...(academic_id ? { academic_id } : {}),
      ...(faculty_id ? { faculty_id } : {}),
      ...(semester_id ? { semester_id } : {}),
    };
    const skip = (page - 1) * limit;

    // =========================================
    // SEMESTERS (PAGE)
    // =========================================

    const [total, semesters] = await Promise.all([
      prisma.semester.count({ where }),
      prisma.semester.findMany({
        where,
        skip,
        take: limit,
        select: {
          semester_id: true,
          semester_name: true,
          academic: { select: { academic_id: true, year: true } },
          faculty: { select: { faculty_id: true, faculty_name: true } },
          _count: { select: { students: true, courses: true } },
        },
        orderBy: { semester_id: "desc" },
      }),
    ]);

    const semesterIds = semesters.map((s) => s.semester_id);

    // =========================================
    // PUBLISHED RESULT AGGREGATES (DB-side groupBy, per semester)
    // =========================================

    const [resultCounts, resultGrades] = semesterIds.length
      ? await Promise.all([
          prisma.result.groupBy({
            by: ["semester_id"],
            where: { status: ResultStatus.PUBLISHED, semester_id: { in: semesterIds } },
            _count: { _all: true },
            _avg: { gpa: true },
          }),
          prisma.result.groupBy({
            by: ["semester_id", "grade"],
            where: { status: ResultStatus.PUBLISHED, semester_id: { in: semesterIds } },
            _count: { _all: true },
          }),
        ])
      : [[], []];

    const countBySemester = new Map(resultCounts.map((r) => [r.semester_id, r]));

    const passFailBySemester = new Map<number, { pass: number; fail: number }>();
    for (const row of resultGrades) {
      const stats = passFailBySemester.get(row.semester_id) ?? { pass: 0, fail: 0 };
      if (row.grade === "F") {
        stats.fail += row._count._all;
      } else {
        stats.pass += row._count._all;
      }
      passFailBySemester.set(row.semester_id, stats);
    }

    // =========================================
    // RESPONSE
    // =========================================

    const data = semesters.map((s) => {
      const countRow = countBySemester.get(s.semester_id);
      const publishedCount = countRow?._count._all ?? 0;
      const averageGpa = publishedCount > 0 ? Number((countRow?._avg.gpa ?? 0).toFixed(2)) : 0;
      const passFail = passFailBySemester.get(s.semester_id);

      return {
        semester_id: s.semester_id,
        semester_name: s.semester_name,
        academic_year: s.academic.year,
        faculty_id: s.faculty.faculty_id,
        faculty_name: s.faculty.faculty_name,
        student_count: s._count.students,
        course_count: s._count.courses,
        published_result_count: publishedCount,
        average_gpa: averageGpa,
        pass_count: passFail?.pass ?? 0,
        fail_count: passFail?.fail ?? 0,
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
    console.log("GET_SEMESTER_REPORT_ERROR", error);
    return prismaErrorResponse(error, "Failed to fetch semester performance report");
  }
}
