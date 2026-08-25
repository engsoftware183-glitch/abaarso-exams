import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";

// ======================================================
// GET SINGLE ASSESSMENT
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

    // Ownership check happens in the query itself so a STUDENT
    // requesting another student's record gets the same 404 as a
    // nonexistent id - it never reveals whether the record exists.
    const assessment =
      await prisma.assessment.findFirst({
        where: {
          assessment_id: Number(id),
          ...(auth.student
            ? { student_id: auth.student.student_id }
            : {}),
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

    return prismaErrorResponse(error, "Failed to fetch assessment");
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

    void logActivity("UPDATE_ASSESSMENT", `Updated assessment ID ${id}`);

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

    return prismaErrorResponse(error, "Failed to update assessment");
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
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

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

    void logActivity("DELETE_ASSESSMENT", `Deleted assessment ID ${id}`);

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

    return prismaErrorResponse(error, "Failed to delete assessment");
  }
}