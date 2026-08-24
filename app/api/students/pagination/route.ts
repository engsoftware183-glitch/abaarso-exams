import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// PAGINATION STUDENTS
// ======================================================

export async function GET(req: NextRequest) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = await requireStudentScope(req);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // QUERY PARAMS
    // =========================================

    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 10));
    const search = req.nextUrl.searchParams.get("search")?.trim();
    const academicId = req.nextUrl.searchParams.get("academic_id")?.trim();
    const facultyId = req.nextUrl.searchParams.get("faculty_id")?.trim();
    const departmentId = req.nextUrl.searchParams.get("department_id")?.trim();
    const semesterId = req.nextUrl.searchParams.get("semester_id")?.trim();

    const skip = (page - 1) * limit;

    // =========================================
    // WHERE CLAUSE
    // =========================================

    // Phase 0 rule preserved: a STUDENT may only ever see their own
    // record - the query itself is scoped so no other student's PII
    // can leak. Filters only apply to unrestricted roles.
    const where: Prisma.StudentWhereInput = {
      ...(auth.student ? { student_id: auth.student.student_id } : {}),
      ...(search
        ? {
            OR: [
              {
                full_name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                roll_no: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(academicId ? { academic_id: Number(academicId) } : {}),
      ...(facultyId ? { faculty_id: Number(facultyId) } : {}),
      ...(departmentId ? { department_id: Number(departmentId) } : {}),
      ...(semesterId ? { semester_id: Number(semesterId) } : {}),
    };

    // =========================================
    // GET STUDENTS
    // =========================================

    const students =
      await prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          academic: true,
          faculty: true,
          department: true,
          semester: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

    // =========================================
    // TOTAL
    // =========================================

    const total =
      await prisma.student.count({ where });

    return NextResponse.json(
      {
        success: true,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        students,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "PAGINATION_STUDENTS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to paginate students");
  }
}
