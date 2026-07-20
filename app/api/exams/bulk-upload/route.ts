import { NextRequest, NextResponse } from "next/server";
import { ExamType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ExamInput = {
  exam_type: ExamType;
  total_marks: number;
  exam_date: string;
  academic_id: number;
  faculty_id: number;
  semester_id: number;
  course_id: number;
};

// ======================================================
// BULK UPLOAD EXAMS
// ======================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { exams } = body;

    if (!exams || !Array.isArray(exams)) {
      return NextResponse.json(
        {
          success: false,
          message: "Exams array is required",
        },
        { status: 400 }
      );
    }

    const createdExams =
      await prisma.exam.createMany({
        data: exams.map(
          (exam: ExamInput) => ({
            exam_type: exam.exam_type,

            total_marks: Number(
              exam.total_marks
            ),

            exam_date: new Date(
              exam.exam_date
            ),

            academic_id: Number(
              exam.academic_id
            ),

            faculty_id: Number(
              exam.faculty_id
            ),

            semester_id: Number(
              exam.semester_id
            ),

            course_id: Number(
              exam.course_id
            ),
          })
        ),
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Exam bulk upload successful",

        total:
          createdExams.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(
      "BULK_EXAM_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to bulk upload exams",
      },
      { status: 500 }
    );
  }
}