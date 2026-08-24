import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { ResultStatus } from "@prisma/client";

// ======================================================
// GRADE DISTRIBUTION REPORT
// ======================================================
//
// Uses Result.grade as actually stored (no invented labels). Only
// PUBLISHED results count toward official grade distribution. Filter
// idiom (academic/faculty via semester, department via course) matches
// the existing /api/reports/courses convention.

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

    const rawFilters: Record<string, string | null> = {
      academic_id: searchParams.get("academic_id"),
      faculty_id: searchParams.get("faculty_id"),
      department_id: searchParams.get("department_id"),
      semester_id: searchParams.get("semester_id"),
      course_id: searchParams.get("course_id"),
    };

    const ids: Record<string, number> = {};
    for (const [key, value] of Object.entries(rawFilters)) {
      if (value === null) continue;
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) {
        return NextResponse.json(
          { success: false, message: `${key} must be a valid numeric ID` },
          { status: 400 }
        );
      }
      ids[key] = parsed;
    }

    const where: Prisma.ResultWhereInput = {
      status: ResultStatus.PUBLISHED,
      ...(ids.course_id ? { course_id: ids.course_id } : {}),
      ...(ids.semester_id ? { semester_id: ids.semester_id } : {}),
      ...(ids.department_id ? { course: { department_id: ids.department_id } } : {}),
      ...((ids.academic_id || ids.faculty_id) && {
        semester: {
          ...(ids.academic_id ? { academic_id: ids.academic_id } : {}),
          ...(ids.faculty_id ? { faculty_id: ids.faculty_id } : {}),
        },
      }),
    };

    // =========================================
    // GRADE DISTRIBUTION (DB-side groupBy)
    // =========================================

    const groups = await prisma.result.groupBy({
      by: ["grade"],
      where,
      _count: { _all: true },
    });

    const totalGraded = groups.reduce((sum, row) => sum + row._count._all, 0);

    const data = groups
      .filter((row) => row.grade !== null)
      .map((row) => ({
        grade: row.grade as string,
        count: row._count._all,
        percentage: totalGraded > 0 ? Number(((row._count._all / totalGraded) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(
      {
        success: true,
        data,
        total: totalGraded,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("GET_GRADE_DISTRIBUTION_ERROR", error);
    return prismaErrorResponse(error, "Failed to fetch grade distribution report");
  }
}
