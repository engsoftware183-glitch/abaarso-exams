import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================================
// CREATE ATTENDANCE
// ======================================================

export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create attendance",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// GET ALL ATTENDANCE
// ======================================================

export async function GET() {
  try {
    const attendances =
      await prisma.attendance.findMany({
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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch attendance",
      },
      { status: 500 }
    );
  }
}