import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";

import { ResultStatus } from "@prisma/client";

// ======================================================
// PAGINATION RESULTS
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
    // QUERY PARAMETERS
    // =========================================

    const searchParams =
      req.nextUrl.searchParams;

    const page = Math.max(1, Number(
      searchParams.get("page") || 1
    ));

    const limit = Math.min(100, Math.max(1, Number(
      searchParams.get("limit") || 10
    )));

    const skip =
      (page - 1) * limit;

    const search = searchParams.get("search")?.trim();
    const semesterId = searchParams.get("semester_id")?.trim();
    const courseId = searchParams.get("course_id")?.trim();
    const statusParam = searchParams.get("status")?.trim();

    // =========================================
    // WHERE CLAUSE
    // =========================================

    const status =
      statusParam === "PUBLISHED"
        ? ResultStatus.PUBLISHED
        : statusParam === "DRAFT"
        ? ResultStatus.DRAFT
        : undefined;

    // SECURITY: for STUDENT callers the status is always forced to
    // PUBLISHED at the database level regardless of any query parameter
    // the client supplied. Admins retain the ability to filter freely.
    const statusFilter: ResultStatus | undefined = auth.student
      ? ResultStatus.PUBLISHED
      : status;

    const where: Prisma.ResultWhereInput = {
      ...(auth.student
        ? { student_id: auth.student.student_id }
        : {}),

      ...(search
        ? {
            OR: [
              {
                student: {
                  full_name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                student: {
                  roll_no: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
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
              {
                grade: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),

      ...(semesterId ? { semester_id: Number(semesterId) } : {}),
      ...(courseId ? { course_id: Number(courseId) } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    const totalRecords =
      await prisma.result.count({ where });

    // =========================================
    // GET RESULTS
    // =========================================

    const results =
      await prisma.result.findMany({

        where,

        skip,

        take: limit,

        orderBy: {
          result_id: "desc",
        },

        include: {

          student: {
            select: {
              student_id: true,
              full_name: true,
              roll_no: true,
              email: true,
            },
          },

          course: {
            select: {
              course_id: true,
              course_name: true,
              course_code: true,
            },
          },

          semester: {
            select: {
              semester_id: true,
              semester_name: true,
            },
          },



        },

      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        currentPage: page,

        perPage: limit,

        total: totalRecords,

        totalRecords,

        totalPages: Math.ceil(
          totalRecords / limit
        ),

        results,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "PAGINATION_RESULTS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to paginate results");

  }
}
