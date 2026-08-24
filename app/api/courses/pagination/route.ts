import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// PAGINATION COURSES
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
    const departmentId = req.nextUrl.searchParams.get("department_id")?.trim();
    const semesterId = req.nextUrl.searchParams.get("semester_id")?.trim();

    const skip = (page - 1) * limit;

    // =========================================
    // WHERE CLAUSE
    // =========================================

    // Phase 0 rule preserved: a STUDENT only ever sees the courses of
    // their own department - the same relationship used everywhere else.
    const where: Prisma.CourseWhereInput = {
      ...(auth.student ? { department_id: auth.student.department_id } : {}),
      ...(search
        ? {
            OR: [
              {
                course_code: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                course_name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(departmentId ? { department_id: Number(departmentId) } : {}),
      ...(semesterId ? { semester_id: Number(semesterId) } : {}),
    };

    // =========================================
    // GET COURSES
    // =========================================

    const courses =
      await prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          semester: true,
          _count: {
            select: {
              results: true,
              exams: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

    // =========================================
    // TOTAL
    // =========================================

    const total =
      await prisma.course.count({ where });

    return NextResponse.json(
      {
        success: true,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        courses,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "PAGINATION_COURSES_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to paginate courses");
  }
}
