import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================================
// GET SINGLE ASSESSMENT
// ======================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const assessment =
      await prisma.assessment.findUnique({
        where: {
          assessment_id: Number(id),
        },

        include: {
          student: true,
          course: true,
        },
      });

    if (!assessment) {
      return NextResponse.json(
        {
          success: false,
          message: "Assessment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        assessment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "GET_SINGLE_ASSESSMENT_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch assessment",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// UPDATE ASSESSMENT
// ======================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const {
      assignment_mark,
      quiz_mark,
      student_id,
      course_id,
    } = body;

    const existingAssessment =
      await prisma.assessment.findUnique({
        where: {
          assessment_id: Number(id),
        },
      });

    if (!existingAssessment) {
      return NextResponse.json(
        {
          success: false,
          message: "Assessment not found",
        },
        { status: 404 }
      );
    }

    const total_assessment =
      Number(assignment_mark) +
      Number(quiz_mark);

    const updatedAssessment =
      await prisma.assessment.update({
        where: {
          assessment_id: Number(id),
        },

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
        assessment: updatedAssessment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "UPDATE_ASSESSMENT_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update assessment",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE ASSESSMENT
// ======================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingAssessment =
      await prisma.assessment.findUnique({
        where: {
          assessment_id: Number(id),
        },
      });

    if (!existingAssessment) {
      return NextResponse.json(
        {
          success: false,
          message: "Assessment not found",
        },
        { status: 404 }
      );
    }

    await prisma.assessment.delete({
      where: {
        assessment_id: Number(id),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Assessment deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "DELETE_ASSESSMENT_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete assessment",
      },
      { status: 500 }
    );
  }
}