import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// SEARCH ATTENDANCE
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

    const { searchParams } = new URL(req.url);

    const search =
      searchParams.get("search") || "";

    const attendances =
      await prisma.attendance.findMany({
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
          attendance_id: "desc",
        },
      });

    return NextResponse.json(
      {
        success: true,
        total: attendances.length,
        attendances,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("SEARCH_ATTENDANCE_ERROR", error);

    return prismaErrorResponse(error, "Failed to search attendance");
  }
}