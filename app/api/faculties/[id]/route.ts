import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// GET SINGLE FACULTY
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
    // FIND FACULTY
    // =========================================

    const faculty =
      await prisma.faculty.findUnique({
        where: {
          faculty_id: Number(
            params.id
          ),
        },
      });

    // =========================================
    // NOT FOUND
    // =========================================

    if (!faculty) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty not found",
        },
        {
          status: 404,
        }
      );
    }

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,
        faculty,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_SINGLE_FACULTY_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch faculty",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// UPDATE FACULTY
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
      faculty_name,
    } = body;

    // =========================================
    // UPDATE FACULTY
    // =========================================

    const faculty =
      await prisma.faculty.update({
        where: {
          faculty_id: Number(
            params.id
          ),
        },

        data: {
          faculty_name,
        },
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Faculty updated successfully",

        faculty,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "UPDATE_FACULTY_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update faculty",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// DELETE FACULTY
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
    // DELETE FACULTY
    // =========================================

    await prisma.faculty.delete({
      where: {
        faculty_id: Number(
          params.id
        ),
      },
    });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Faculty deleted successfully",
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "DELETE_FACULTY_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete faculty",
      },
      {
        status: 500,
      }
    );
  }
}