import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// PAGINATION STUDENTS
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
    // QUERY PARAMS
    // =========================================

    const page =
      Number(
        req.nextUrl.searchParams.get("page")
      ) || 1;

    const limit =
      Number(
        req.nextUrl.searchParams.get("limit")
      ) || 10;

    const skip =
      (page - 1) * limit;

    // =========================================
    // GET STUDENTS
    // =========================================

    const students =
      await prisma.student.findMany({

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
      await prisma.student.count();

    return NextResponse.json(
      {
        success: true,

        page,

        limit,

        total,

        totalPages:
          Math.ceil(total / limit),

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