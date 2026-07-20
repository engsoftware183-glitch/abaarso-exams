import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// GET SINGLE SEMESTER
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
    // GET PARAMS
    // =========================================

    const params =
      await context.params;

    // =========================================
    // FIND SEMESTER
    // =========================================

    const semester =
      await prisma.semester.findUnique({

        where: {
          semester_id:
            Number(params.id),
        },

        include: {
          academic: true,
          faculty: true,
        },

      });

    // =========================================
    // NOT FOUND
    // =========================================

    if (!semester) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Semester not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        semester,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_SINGLE_SEMESTER_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch semester",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// UPDATE SEMESTER
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
    // GET PARAMS
    // =========================================

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
      semester_name,
      academic_id,
      faculty_id,
    } = body;

    // =========================================
    // UPDATE SEMESTER
    // =========================================

    const semester =
      await prisma.semester.update({

        where: {
          semester_id:
            Number(params.id),
        },

        data: {
          semester_name,
          academic_id:
            Number(academic_id),
          faculty_id:
            Number(faculty_id),
        },

        include: {
          academic: true,
          faculty: true,
        },

      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Semester updated successfully",

        semester,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "UPDATE_SEMESTER_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update semester",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// DELETE SEMESTER
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
    // GET PARAMS
    // =========================================

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
    // DELETE SEMESTER
    // =========================================

    await prisma.semester.delete({
      where: {
        semester_id:
          Number(params.id),
      },
    });

    return NextResponse.json(
      {
        success: true,

        message:
          "Semester deleted successfully",
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "DELETE_SEMESTER_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete semester",
      },
      {
        status: 500,
      }
    );
  }
}