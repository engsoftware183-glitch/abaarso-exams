import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================================
// CREATE ASSESSMENT
// ======================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      assignment_mark,
      quiz_mark,
      student_id,
      course_id,
    } = body;

    if (
      assignment_mark === undefined ||
      quiz_mark === undefined ||
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

    const total_assessment =
      Number(assignment_mark) +
      Number(quiz_mark);

    const assessment =
      await prisma.assessment.create({
        data: {
          assignment_mark,
          quiz_mark,
          total_assessment,
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
        assessment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(
      "CREATE_ASSESSMENT_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create assessment",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// GET ALL ASSESSMENTS
// ======================================================

export async function GET() {
  try {
    const assessments =
      await prisma.assessment.findMany({
        include: {
          student: true,
          course: true,
        },

        orderBy: {
          assessment_id: "desc",
        },
      });

    return NextResponse.json(
      {
        success: true,
        total: assessments.length,
        assessments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "GET_ASSESSMENTS_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch assessments",
      },
      { status: 500 }
    );
  }
}