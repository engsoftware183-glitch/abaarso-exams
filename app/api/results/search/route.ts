import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";

import { ResultStatus } from "@prisma/client";

// ======================================================
// SEARCH RESULTS
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
    // GET SEARCH QUERY
    // =========================================

    const searchParams =
      req.nextUrl.searchParams;

    const query =
      searchParams.get("query") || "";

    // =========================================
    // SEARCH RESULTS
    // =========================================

    // SECURITY: students must only ever see PUBLISHED results.
    // The status filter is enforced unconditionally at the DB level.
    // Students also cannot search by status keyword to discover drafts.
    const studentStatusFilter = auth.student ? ResultStatus.PUBLISHED : undefined;

    const results =
      await prisma.result.findMany({

        where: {
          ...(auth.student
            ? { student_id: auth.student.student_id, status: studentStatusFilter }
            : {}),

          OR: [

            {
              student: {
                full_name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },

            {
              student: {
                roll_no: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },

            {
              course: {
                course_name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },

            {
              course: {
                course_code: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },

            {
              grade: {
                contains: query,
                mode: "insensitive",
              },
            },

            {
              remarks: {
                contains: query,
                mode: "insensitive",
              },
            },

            // For admins only: allow status keyword search (DRAFT / PUBLISHED).
            // Students already have status locked to PUBLISHED above.
            ...(!auth.student
              ? [
                  {
                    status:
                      query.toUpperCase() === "DRAFT"
                        ? ResultStatus.DRAFT
                        : query.toUpperCase() === "PUBLISHED"
                        ? ResultStatus.PUBLISHED
                        : undefined,
                  },
                ]
              : []),

          ],
        },

        include: {

          student: {
            select: {
              student_id: true,
              full_name: true,
              roll_no: true,
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

        orderBy: {
          result_id: "desc",
        },

      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,
        count: results.length,
        results,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "SEARCH_RESULTS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to search results");

  }
}
