import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { ResultStatus } from "@prisma/client";

// ======================================================
// CGPA RANKING REPORT
// ======================================================
//
// Uses the existing verified CGPA formula (same as
// /api/transcripts/[student_id]): CGPA = sum(gpa * credit_hours) /
// sum(credit_hours), computed from PUBLISHED results only. Filters
// select which students to rank (their own academic/faculty/
// department/semester); each ranked student's CGPA is still their
// true cumulative GPA across all of their own PUBLISHED results, not
// just results within the filtered scope - identical in meaning to
// the transcript's CGPA. Ranking/pagination happens server-side.

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

    const rawFilters: Record<string, string | null> = {
      academic_id: searchParams.get("academic_id"),
      faculty_id: searchParams.get("faculty_id"),
      department_id: searchParams.get("department_id"),
      semester_id: searchParams.get("semester_id"),
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

    const where: Prisma.StudentWhereInput = {
      ...(ids.academic_id ? { academic_id: ids.academic_id } : {}),
      ...(ids.faculty_id ? { faculty_id: ids.faculty_id } : {}),
      ...(ids.department_id ? { department_id: ids.department_id } : {}),
      ...(ids.semester_id ? { semester_id: ids.semester_id } : {}),
    };

    // =========================================
    // STUDENTS IN SCOPE
    // =========================================

    const students = await prisma.student.findMany({
      where,
      select: {
        student_id: true,
        roll_no: true,
        full_name: true,
        faculty: { select: { faculty_id: true, faculty_name: true } },
        department: { select: { department_id: true, department_name: true } },
      },
    });

    if (students.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          pagination: { total: 0, page, limit, totalPages: 1 },
        },
        { status: 200 }
      );
    }

    const studentIds = students.map((s) => s.student_id);

    // =========================================
    // PUBLISHED RESULTS -> CREDIT-WEIGHTED CGPA
    // =========================================

    const results = await prisma.result.findMany({
      where: { status: ResultStatus.PUBLISHED, student_id: { in: studentIds } },
      select: {
        student_id: true,
        gpa: true,
        course: { select: { credit_hours: true } },
      },
    });

    const totals = new Map<number, { sumGpaCredits: number; totalCreditHours: number }>();
    for (const result of results) {
      const entry = totals.get(result.student_id) ?? { sumGpaCredits: 0, totalCreditHours: 0 };
      entry.sumGpaCredits += result.gpa * result.course.credit_hours;
      entry.totalCreditHours += result.course.credit_hours;
      totals.set(result.student_id, entry);
    }

    // =========================================
    // RANK (deterministic ties: cgpa desc, credit hours desc, name asc, id asc)
    // =========================================

    const ranked = students
      .map((s) => {
        const entry = totals.get(s.student_id);
        const totalCreditHours = entry?.totalCreditHours ?? 0;
        const cgpa = totalCreditHours > 0 ? Number((entry!.sumGpaCredits / totalCreditHours).toFixed(2)) : 0;

        return {
          student_id: s.student_id,
          roll_no: s.roll_no,
          full_name: s.full_name,
          faculty_id: s.faculty.faculty_id,
          faculty_name: s.faculty.faculty_name,
          department_id: s.department.department_id,
          department_name: s.department.department_name,
          total_credit_hours: totalCreditHours,
          cgpa,
        };
      })
      .sort((a, b) => {
        if (b.cgpa !== a.cgpa) return b.cgpa - a.cgpa;
        if (b.total_credit_hours !== a.total_credit_hours) return b.total_credit_hours - a.total_credit_hours;
        const nameCompare = a.full_name.localeCompare(b.full_name);
        if (nameCompare !== 0) return nameCompare;
        return a.student_id - b.student_id;
      })
      .map((row, index) => ({ rank: index + 1, ...row }));

    // =========================================
    // PAGINATE THE RANKED LIST
    // =========================================

    const total = ranked.length;
    const skip = (page - 1) * limit;
    const data = ranked.slice(skip, skip + limit);

    return NextResponse.json(
      {
        success: true,
        data,
        pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("GET_CGPA_RANKING_ERROR", error);
    return prismaErrorResponse(error, "Failed to fetch CGPA ranking report");
  }
}
