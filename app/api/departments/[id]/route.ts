import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// GET SINGLE DEPARTMENT
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
    // FIND DEPARTMENT
    // =========================================

    const department =
      await prisma.department.findUnique({

        where: {
          department_id:
            Number(params.id),
        },

        include: {
          faculty: true,
        },

      });

    // =========================================
    // NOT FOUND
    // =========================================

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Department not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        department,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_SINGLE_DEPARTMENT_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch department",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// UPDATE DEPARTMENT
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
      department_name,
      faculty_id,
    } = body;

    // =========================================
    // UPDATE DEPARTMENT
    // =========================================

    const department =
      await prisma.department.update({

        where: {
          department_id:
            Number(params.id),
        },

        data: {
          department_name,
          faculty_id:
            Number(faculty_id),
        },

        include: {
          faculty: true,
        },

      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Department updated successfully",

        department,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "UPDATE_DEPARTMENT_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update department",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// DELETE DEPARTMENT
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
    // DELETE DEPARTMENT
    // =========================================

    await prisma.department.delete({
      where: {
        department_id:
          Number(params.id),
      },
    });

    return NextResponse.json(
      {
        success: true,

        message:
          "Department deleted successfully",
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "DELETE_DEPARTMENT_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete department",
      },
      {
        status: 500,
      }
    );
  }
}