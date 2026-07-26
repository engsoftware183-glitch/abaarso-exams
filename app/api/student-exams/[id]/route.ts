import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// GET SINGLE STUDENT EXAM
// ======================================================

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    const params = await context.params;

    const studentExam = await prisma.studentExam.findUnique({
      where: {
        student_exam_id: Number(params.id),
      },

      include: {
        student: {
          select: {
            student_id: true,
            full_name: true,
            roll_no: true,
            gender: true,
            email: true,
          },
        },

        exam: {
          include: {
            academic: true,
            faculty: true,
            semester: true,
            course: true,
          },
        },
      },
    });

    if (!studentExam) {
      return NextResponse.json(
        {
          success: false,
          message: "Student Exam not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        studentExam,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("GET_STUDENT_EXAM_ERROR", error);

    return prismaErrorResponse(error, "Failed to fetch Student Exam");
  }
}

// ======================================================
// UPDATE STUDENT EXAM
// ======================================================

export async function PUT(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    const params = await context.params;

    const body = await req.json();

    const studentExam = await prisma.studentExam.findUnique({
      where: {
        student_exam_id: Number(params.id),
      },

      include: {
        exam: true,
      },
    });

    if (!studentExam) {
      return NextResponse.json(
        {
          success: false,
          message: "Student Exam not found",
        },
        { status: 404 }
      );
    }

    const marks = Number(body.marks);

    if (marks < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Marks cannot be negative",
        },
        { status: 400 }
      );
    }

    if (marks > studentExam.exam.total_marks) {
      return NextResponse.json(
        {
          success: false,
          message: `Marks cannot exceed ${studentExam.exam.total_marks}`,
        },
        { status: 400 }
      );
    }

    const updatedStudentExam = await prisma.studentExam.update({
      where: {
        student_exam_id: Number(params.id),
      },

      data: {
        marks,
      },

      include: {
        student: {
          select: {
            student_id: true,
            full_name: true,
            roll_no: true,
            email: true,
          },
        },

        exam: {
          include: {
            academic: true,
            faculty: true,
            semester: true,
            course: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Student Exam updated successfully",
        studentExam: updatedStudentExam,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("UPDATE_STUDENT_EXAM_ERROR", error);

    return prismaErrorResponse(error, "Failed to update Student Exam");
  }
}

// ======================================================
// DELETE STUDENT EXAM
// ======================================================

export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    const params = await context.params;

    const studentExam = await prisma.studentExam.findUnique({
      where: {
        student_exam_id: Number(params.id),
      },
    });

    if (!studentExam) {
      return NextResponse.json(
        {
          success: false,
          message: "Student Exam not found",
        },
        { status: 404 }
      );
    }

    await prisma.studentExam.delete({
      where: {
        student_exam_id: Number(params.id),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Student Exam deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("DELETE_STUDENT_EXAM_ERROR", error);

    return prismaErrorResponse(error, "Failed to delete Student Exam");
  }
}
