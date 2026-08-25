import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ResultStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";


// ======================================================
// GET SINGLE RESULT
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
    // SECURITY: the status constraint also ensures DRAFT records appear
    // indistinguishable from non-existent records for students.
    const result = await prisma.result.findFirst({
      where: {
        result_id: Number(id),
        ...(auth.student
          ? { student_id: auth.student.student_id, status: ResultStatus.PUBLISHED }
          : {}),
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

        course: {
          select: {
            course_id: true,
            course_name: true,
            course_code: true,
          },
        },

        semester: {
          select: {
            semester_id: true,
            semester_name: true,
          },
        },


      },
    });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Result not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        result,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_RESULT_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch result");
  }
}

// ======================================================
// UPDATE RESULT STATUS (PUBLISH / UNPUBLISH)
// ======================================================
//
// Only the status is mutable here - total_marks, grade, gpa and
// remarks are always derived from attendance/assessment/exam marks
// when a result is (re)generated, so they are never edited directly.

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

    const status = body.status;

    if (status !== ResultStatus.DRAFT && status !== ResultStatus.PUBLISHED) {
      return NextResponse.json(
        {
          success: false,
          message: "Status must be DRAFT or PUBLISHED",
        },
        {
          status: 400,
        }
      );
    }

    const existingResult =
      await prisma.result.findUnique({
        where: {
          result_id: Number(id),
        },
      });

    if (!existingResult) {
      return NextResponse.json(
        {
          success: false,
          message: "Result not found",
        },
        {
          status: 404,
        }
      );
    }

    const updatedResult =
      await prisma.result.update({
        where: {
          result_id: Number(id),
        },

        data: {
          status,
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

          course: {
            select: {
              course_id: true,
              course_name: true,
              course_code: true,
            },
          },

          semester: {
            select: {
              semester_id: true,
              semester_name: true,
            },
          },
        },
      });

    void logActivity("PUBLISH_RESULT", `${status === "PUBLISHED" ? "Published" : "Unpublished"} result ID ${id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Result updated successfully",
        result: updatedResult,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "UPDATE_RESULT_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to update result");
  }
}

// ======================================================
// DELETE RESULT
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

    const existingResult =
      await prisma.result.findUnique({
        where: {
          result_id: Number(id),
        },
      });

    if (!existingResult) {
      return NextResponse.json(
        {
          success: false,
          message: "Result not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.result.delete({
      where: {
        result_id: Number(id),
      },
    });

    void logActivity("DELETE_RESULT", `Deleted result ID ${id}`);

    return NextResponse.json(
      {
        success: true,
        message:
          "Result deleted successfully",
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "DELETE_RESULT_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to delete result");
  }
}
