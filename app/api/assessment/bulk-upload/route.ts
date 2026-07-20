import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================================
// BULK UPLOAD ASSESSMENT
// ======================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { assessments } = body;

    if (
      !assessments ||
      !Array.isArray(assessments)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Assessments array is required",
        },
        { status: 400 }
      );
    }

    const formattedAssessments =
      assessments.map(
        (assessment: {
          assignment_mark: number;
          quiz_mark: number;
          student_id: number;
          course_id: number;
        }) => {
          const assignment_mark =
            Number(
              assessment.assignment_mark
            ) || 0;

          const quiz_mark =
            Number(
              assessment.quiz_mark
            ) || 0;

          return {
            assignment_mark,

            quiz_mark,

            total_assessment:
              assignment_mark +
              quiz_mark,

            student_id:
              assessment.student_id,

            course_id:
              assessment.course_id,
          };
        }
      );

    console.log(
      "FORMATTED ASSESSMENTS:",
      formattedAssessments
    );

    const createdAssessments =
      await prisma.assessment.createMany({
        data: formattedAssessments,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Assessment bulk upload successful",

        total:
          createdAssessments.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(
      "BULK_ASSESSMENT_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to bulk upload assessment",
      },
      { status: 500 }
    );
  }
}