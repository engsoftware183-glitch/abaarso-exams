import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


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

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    const result = await prisma.result.findUnique({
      where: {
        result_id: Number(id),
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
