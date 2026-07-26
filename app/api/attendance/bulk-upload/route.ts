import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// BULK UPLOAD ATTENDANCE
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

    const { attendances } = body;

    if (
      !attendances ||
      !Array.isArray(attendances)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendances array is required",
        },
        { status: 400 }
      );
    }

    const formattedAttendances =
      attendances.map(
        (attendance: {
          attendance_mark: number;
          student_id: number;
          course_id: number;
        }) => ({
          attendance_mark:
            attendance.attendance_mark,

          attendance_percent:
            Number(
              attendance.attendance_mark
            ) * 10,

          student_id:
            attendance.student_id,

          course_id:
            attendance.course_id,
        })
      );

    console.log(
      "FORMATTED ATTENDANCES:",
      formattedAttendances
    );

    const createdAttendances =
      await prisma.attendance.createMany({
        data: formattedAttendances,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Attendance bulk upload successful",

        total: createdAttendances.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(
      "BULK_ATTENDANCE_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to bulk upload attendance");
  }
}