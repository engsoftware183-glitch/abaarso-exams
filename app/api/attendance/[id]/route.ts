import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// GET SINGLE ATTENDANCE
// ======================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = await requireStudentScope(req);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    // Ownership check happens in the query itself (not a separate
    // if-check after fetch) so a STUDENT requesting another
    // student's record gets the same 404 as a nonexistent id -
    // it never reveals whether the record exists.
    const attendance =
      await prisma.attendance.findFirst({
        where: {
          attendance_id: Number(id),
          ...(auth.student
            ? { student_id: auth.student.student_id }
            : {}),
        },

        include: {
          student: true,
          course: true,
        },
      });

    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        attendance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "GET_SINGLE_ATTENDANCE_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch attendance");
  }
}

// ======================================================
// UPDATE ATTENDANCE
// ======================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    const body = await req.json();

    const {
      attendance_mark,
      student_id,
      course_id,
    } = body;

    const existingAttendance =
      await prisma.attendance.findUnique({
        where: {
          attendance_id: Number(id),
        },
      });

    if (!existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance not found",
        },
        { status: 404 }
      );
    }

    const attendance_percent =
      attendance_mark * 10;

    const updatedAttendance =
      await prisma.attendance.update({
        where: {
          attendance_id: Number(id),
        },

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
        attendance: updatedAttendance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "UPDATE_ATTENDANCE_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to update attendance");
  }
}

// ======================================================
// DELETE ATTENDANCE
// ======================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    const existingAttendance =
      await prisma.attendance.findUnique({
        where: {
          attendance_id: Number(id),
        },
      });

    if (!existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance not found",
        },
        { status: 404 }
      );
    }

    await prisma.attendance.delete({
      where: {
        attendance_id: Number(id),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Attendance deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "DELETE_ATTENDANCE_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to delete attendance");
  }
}