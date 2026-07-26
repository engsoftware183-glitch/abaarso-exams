import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// SEARCH ASSESSMENT
// ======================================================

export async function GET(req: NextRequest) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } =
      new URL(req.url);

    const search =
      searchParams.get("search") || "";

    const assessments =
      await prisma.assessment.findMany({
        where: {
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
              course: {
                course_name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ],
        },

        include: {
          student: true,
          course: true,
        },

        orderBy: {
          assessment_id: "desc",
        },
      });

    return NextResponse.json(
      {
        success: true,
        total: assessments.length,
        assessments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "SEARCH_ASSESSMENT_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to search assessments");
  }
}