import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// PAGINATION ATTENDANCE
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

    const page = Number(searchParams.get("page")) || 1;

    const limit = Number(searchParams.get("limit")) || 5;

    const skip = (page - 1) * limit;

    const total =
      await prisma.attendance.count();

    const attendances =
      await prisma.attendance.findMany({
        skip,
        take: limit,

        include: {
          student: true,
          course: true,
        },

        orderBy: {
          attendance_id: "desc",
        },
      });

    const totalPages =
      Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        page,
        limit,
        total,
        totalPages,
        attendances,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("PAGINATION_ATTENDANCE_ERROR", error);

    return prismaErrorResponse(error, "Failed to fetch attendance pagination");
  }
}