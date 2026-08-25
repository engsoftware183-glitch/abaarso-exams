import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";

// ======================================================
// CREATE ASSESSMENT
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

    void logActivity("CREATE_ASSESSMENT", `Created assessment for student ${student_id}, course ${course_id}`);

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

    return prismaErrorResponse(error, "Failed to create assessment");
  }
}

// ======================================================
// GET ALL ASSESSMENTS
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

    const assessments =
      await prisma.assessment.findMany({
        where: auth.student
          ? { student_id: auth.student.student_id }
          : undefined,

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

    return prismaErrorResponse(error, "Failed to fetch assessments");
  }
}