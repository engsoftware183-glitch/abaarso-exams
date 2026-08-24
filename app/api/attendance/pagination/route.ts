import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// PAGINATION ATTENDANCE
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

    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10));

    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim();
    const courseId = searchParams.get("course_id")?.trim();

    // =========================================
    // WHERE CLAUSE
    // =========================================

    const where: Prisma.AttendanceWhereInput = {
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
            ],
          }
        : {}),

      ...(courseId ? { course_id: Number(courseId) } : {}),
    };

    const total =
      await prisma.attendance.count({ where });

    const attendances =
      await prisma.attendance.findMany({
        where,
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
