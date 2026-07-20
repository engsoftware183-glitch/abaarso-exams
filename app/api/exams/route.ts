import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================================
// CREATE EXAM
// ======================================================

export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create exam",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// GET ALL EXAMS
// ======================================================

export async function GET() {
  try {
    const exams =
      await prisma.exam.findMany({
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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch exams",
      },
      { status: 500 }
    );
  }
}