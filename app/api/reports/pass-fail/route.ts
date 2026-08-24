import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { ResultStatus } from "@prisma/client";

// ======================================================
// PASS / FAIL REPORT
// ======================================================
//
// Verified grading rule (from app/api/results/route.ts): a result's
// grade is "F" only when total marks < 40 - every other grade
// (D and above) is a pass. No new threshold is invented here. Only
// PUBLISHED results count. Filter idiom matches the existing
// /api/reports/courses convention.

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
    // PASS / FAIL COUNTS
    // =========================================

    const [total, failed] = await Promise.all([
      prisma.result.count({ where }),
      prisma.result.count({ where: { ...where, grade: "F" } }),
    ]);

    const passed = total - failed;
    const passPercentage = total > 0 ? Number(((passed / total) * 100).toFixed(2)) : 0;
    const failPercentage = total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          total_published_results: total,
          passed,
          failed,
          pass_percentage: passPercentage,
          fail_percentage: failPercentage,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("GET_PASS_FAIL_REPORT_ERROR", error);
    return prismaErrorResponse(error, "Failed to fetch pass/fail report");
  }
}
