import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// GET SINGLE EXAM
// ======================================================

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    const params =
      await context.params;

    const exam =
      await prisma.exam.findUnique({
        where: {
          exam_id:
            Number(params.id),
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

    return NextResponse.json(
      {
        success: true,
        exam,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "GET_EXAM_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch exam");
  }
}

// ======================================================
// UPDATE EXAM
// ======================================================

export async function PUT(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    const params =
      await context.params;

    const body =
      await req.json();

    const updatedExam =
      await prisma.exam.update({
        where: {
          exam_id:
            Number(params.id),
        },

        data: {
          exam_type:
            body.exam_type,

          total_marks:
            Number(
              body.total_marks
            ),

          exam_date:
            body.exam_date
              ? new Date(
                  body.exam_date
                )
              : undefined,

          academic_id:
            Number(
              body.academic_id
            ),

          faculty_id:
            Number(
              body.faculty_id
            ),

          semester_id:
            Number(
              body.semester_id
            ),

          course_id:
            Number(
              body.course_id
            ),
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
        },
      });

    return NextResponse.json(
      {
        success: true,
        exam: updatedExam,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "UPDATE_EXAM_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to update exam");
  }
}

// ======================================================
// DELETE EXAM
// ======================================================

export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    const params =
      await context.params;

    await prisma.exam.delete({
      where: {
        exam_id:
          Number(params.id),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Exam deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "DELETE_EXAM_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to delete exam");
  }
}
