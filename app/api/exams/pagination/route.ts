import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
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

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    const page = Number(
      req.nextUrl.searchParams.get(
        "page"
      )
    ) || 1;

    const limit = Number(
      req.nextUrl.searchParams.get(
        "limit"
      )
    ) || 10;

    const skip =
      (page - 1) * limit;

    const totalRecords =
      await prisma.exam.count();

    const exams =
      await prisma.exam.findMany({
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
