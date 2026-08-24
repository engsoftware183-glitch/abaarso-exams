import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireStudentScope, examScopeWhere } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// CREATE EXAM
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
      exam_type,
      total_marks,
      exam_date,
      academic_id,
      faculty_id,
      semester_id,
      course_id,
    } = body;

    const exam = await prisma.exam.create({
      data: {
        exam_type,
        total_marks: Number(total_marks),
        exam_date: new Date(exam_date),
        academic_id: Number(academic_id),
        faculty_id: Number(faculty_id),
        semester_id: Number(semester_id),
        course_id: Number(course_id),
      },
      include: {
        academic: {
          select: {
            year: true,
          },
        },
        faculty: {
          select: {
            faculty_name: true,
          },
        },
        semester: {
          select: {
            semester_name: true,
          },
        },
        course: {
          select: {
            course_name: true,
            course_code: true,
          },
        },
        studentExams: {
          include: {
            student: {
              select: {
                student_id: true,
                full_name: true,
                roll_no: true,
              },
            },
          },
        },
      },
    });


    return NextResponse.json(
      {
        success: true,
        exam,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(
      "CREATE_EXAM_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to create exam");
  }
}

// ======================================================
// GET ALL EXAMS
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

    const exams =
      await prisma.exam.findMany({
        where: examScopeWhere(auth.student),

        include: {
          academic: {
            select: {
              year: true,
            },
          },

          faculty: {
            select: {
              faculty_name: true,
            },
          },

          semester: {
            select: {
              semester_name: true,
            },
          },

          course: {
            select: {
              course_name: true,
              course_code: true,
            },
          },
        },

        orderBy: {
          exam_id: "desc",
        },
      });

    return NextResponse.json(
      {
        success: true,
        total: exams.length,
        exams,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "GET_EXAMS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch exams");
  }
}
