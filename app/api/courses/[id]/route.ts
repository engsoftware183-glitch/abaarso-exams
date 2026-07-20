import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch course",
      },
      {
        status: 500,
      }
    );
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

    const params =
      await context.params;

    // =========================================
    // AUTHORIZATION
    // =========================================

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================
    // ONLY ADMINS
    // =========================================

    if (
      decoded.role !== "SUPER_ADMIN" &&
      decoded.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update course",
      },
      {
        status: 500,
      }
    );
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

    const params =
      await context.params;

    // =========================================
    // AUTHORIZATION
    // =========================================

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================
    // ONLY SUPER ADMIN
    // =========================================

    if (
      decoded.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete course",
      },
      {
        status: 500,
      }
    );
  }
}