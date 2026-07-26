import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

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

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // QUERY PARAMETERS
    // =========================================

    const searchParams =
      req.nextUrl.searchParams;

    const page = Number(
      searchParams.get("page") || 1
    );

    const limit = Number(
      searchParams.get("limit") || 10
    );

    const skip =
      (page - 1) * limit;

    // =========================================
    // TOTAL RECORDS
    // =========================================

    const totalRecords =
      await prisma.result.count();

    // =========================================
    // GET RESULTS
    // =========================================

    const results =
      await prisma.result.findMany({

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
