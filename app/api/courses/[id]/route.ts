import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// GET SINGLE COURSE
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

    const course =
      await prisma.course.findUnique({

        where: {
          course_id:
            Number(params.id),
        },

        include: {
          department: true,
          semester: true,
          results: true,
        },

      });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        course,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_SINGLE_COURSE_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch course");
  }
}


// ======================================================
// UPDATE COURSE
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

    // =========================================
    // REQUEST BODY
    // =========================================

    const body =
      await req.json();

    const {
      course_name,
      course_code,
      credit_hours,
      description,
      department_id,
      semester_id,
    } = body;

    // =========================================
    // UPDATE COURSE
    // =========================================

    const course =
      await prisma.course.update({

        where: {
          course_id:
            Number(params.id),
        },

        data: {
          course_name,

          course_code,

          credit_hours:
            Number(credit_hours),

          description,

          department_id:
            Number(department_id),

          semester_id:
            Number(semester_id),
        },

        include: {
          department: true,
          semester: true,
        },

      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Course updated successfully",

        course,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "UPDATE_COURSE_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to update course");
  }
}


// ======================================================
// DELETE COURSE
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

    // =========================================
    // DELETE COURSE
    // =========================================

    await prisma.course.delete({
      where: {
        course_id:
          Number(params.id),
      },
    });

    return NextResponse.json(
      {
        success: true,

        message:
          "Course deleted successfully",
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "DELETE_COURSE_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to delete course");
  }
}
