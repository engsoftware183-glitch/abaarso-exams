import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// CREATE ATTENDANCE
// ======================================================

export async function POST(req: NextRequest) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();

    const {
      attendance_mark,
      student_id,
      course_id,
    } = body;

    if (
      attendance_mark === undefined ||
      !student_id ||
      !course_id
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    const attendance_percent =
      attendance_mark * 10;

    const attendance =
      await prisma.attendance.create({
        data: {
          attendance_mark,
          attendance_percent,
          student_id,
          course_id,
        },

        include: {
          student: true,
          course: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        attendance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(
      "CREATE_ATTENDANCE_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to create attendance");
  }
}

// ======================================================
// GET ALL ATTENDANCE
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

    const attendances =
      await prisma.attendance.findMany({
        where: auth.student
          ? { student_id: auth.student.student_id }
          : undefined,

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
    console.log(
      "GET_ATTENDANCE_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch attendance");
  }
}