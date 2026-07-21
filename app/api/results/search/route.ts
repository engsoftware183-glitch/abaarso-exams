import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { ResultStatus } from "@prisma/client";

// ======================================================
// SEARCH RESULTS
// ======================================================

export async function GET(
  req: NextRequest
) {
  try {

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

    const results =
      await prisma.result.findMany({

        where: {
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

            {
              status:
                query.toUpperCase() === "DRAFT"
                  ? ResultStatus.DRAFT
                  : query.toUpperCase() === "PUBLISHED"
                  ? ResultStatus.PUBLISHED
                  : undefined,
            },

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

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );

  }
}