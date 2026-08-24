import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireStudentScope, examScopeWhere } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// PAGINATION EXAMS
// ======================================================

export async function GET(
  req: NextRequest
) {
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

    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10));

    const skip =
      (page - 1) * limit;

    const search = searchParams.get("search")?.trim();
    const academicId = searchParams.get("academic_id")?.trim();
    const facultyId = searchParams.get("faculty_id")?.trim();
    const semesterId = searchParams.get("semester_id")?.trim();
    const courseId = searchParams.get("course_id")?.trim();

    // =========================================
    // WHERE CLAUSE
    // =========================================

    const where: Prisma.ExamWhereInput = {
      ...(examScopeWhere(auth.student) ?? {}),

      ...(search
        ? {
            OR: [
              {
                course: {
                  course_name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                course: {
                  course_code: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),

      ...(academicId ? { academic_id: Number(academicId) } : {}),
      ...(facultyId ? { faculty_id: Number(facultyId) } : {}),
      ...(semesterId ? { semester_id: Number(semesterId) } : {}),
      ...(courseId ? { course_id: Number(courseId) } : {}),
    };

    const totalRecords =
      await prisma.exam.count({ where });

    const exams =
      await prisma.exam.findMany({
        where,
        skip,
        take: limit,

        include: {
          academic: true,

          faculty: true,

          semester: true,

          course: true,
        },

        orderBy: {
          exam_id: "desc",
        },
      });

    const totalPages =
      Math.ceil(
        totalRecords / limit
      );

    return NextResponse.json(
      {
        success: true,

        page,

        limit,

        total: totalRecords,

        totalRecords,

        totalPages,

        exams,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "PAGINATION_EXAM_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch exams");
  }
}
