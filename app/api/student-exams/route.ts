import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";

// ======================================================
// CREATE STUDENT EXAM
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

    const student_id = Number(body.student_id);
    const exam_id = Number(body.exam_id);
    const marks = Number(body.marks);

    // =========================================
    // VALIDATION
    // =========================================

    if (!student_id || !exam_id) {
      return NextResponse.json(
        {
          success: false,
          message: "student_id and exam_id are required",
        },
        { status: 400 }
      );
    }

    if (marks < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Marks cannot be negative",
        },
        { status: 400 }
      );
    }

    // =========================================
    // CHECK STUDENT
    // =========================================

    const student = await prisma.student.findUnique({
      where: {
        student_id,
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        { status: 404 }
      );
    }

    // =========================================
    // CHECK EXAM
    // =========================================

    const exam = await prisma.exam.findUnique({
      where: {
        exam_id,
      },
    });

    if (!exam) {
      return NextResponse.json(
        {
          success: false,
          message: "Exam not found",
        },
        { status: 404 }
      );
    }

    // =========================================
    // CHECK DUPLICATE
    // =========================================

    const existing = await prisma.studentExam.findUnique({
      where: {
        student_id_exam_id: {
          student_id,
          exam_id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Student exam already exists",
        },
        { status: 409 }
      );
    }

    // =========================================
    // MARK VALIDATION
    // =========================================

    if (marks > exam.total_marks) {
      return NextResponse.json(
        {
          success: false,
          message: `Marks cannot exceed ${exam.total_marks}`,
        },
        { status: 400 }
      );
    }

    // =========================================
    // CREATE
    // =========================================

    const studentExam = await prisma.studentExam.create({
      data: {
        student_id,
        exam_id,
        marks,
      },

      include: {
        student: {
          select: {
            student_id: true,
            full_name: true,
            roll_no: true,
          },
        },

        exam: {
          include: {
            course: true,
            semester: true,
            academic: true,
            faculty: true,
          },
        },
      },
    });

    void logActivity("CREATE_STUDENT_EXAM", `Created student exam mark ${marks} for student ${student_id}, exam ${exam_id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Student exam created successfully",
        studentExam,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.log("CREATE_STUDENT_EXAM_ERROR", error);

    return prismaErrorResponse(error, "Failed to create student exam");
  }
}

// ======================================================
// GET ALL STUDENT EXAMS
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

    const studentExams = await prisma.studentExam.findMany({
      where: auth.student
        ? { student_id: auth.student.student_id }
        : undefined,

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
            course: true,
            semester: true,
            academic: true,
            faculty: true,
          },
        },
      },

      orderBy: {
        student_exam_id: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        total: studentExams.length,
        studentExams,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log("GET_STUDENT_EXAMS_ERROR", error);

    return prismaErrorResponse(error, "Failed to fetch student exams");
  }
}
