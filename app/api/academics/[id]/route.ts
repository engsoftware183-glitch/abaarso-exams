import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// GET SINGLE ACADEMIC
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
    // FIND ACADEMIC
    // =========================================

    const academic =
      await prisma.academic.findUnique({
        where: {
          academic_id: Number(
            params.id
          ),
        },
      });

    // =========================================
    // NOT FOUND
    // =========================================

    if (!academic) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Academic not found",
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
        academic,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_SINGLE_ACADEMIC_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch academic",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// UPDATE ACADEMIC
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

    const { year } = body;

    // =========================================
    // UPDATE ACADEMIC
    // =========================================

    const academic =
      await prisma.academic.update({
        where: {
          academic_id: Number(
            params.id
          ),
        },

        data: {
          year,
        },
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Academic updated successfully",

        academic,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "UPDATE_ACADEMIC_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update academic",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// DELETE ACADEMIC
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
    // DELETE ACADEMIC
    // =========================================

    await prisma.academic.delete({
      where: {
        academic_id: Number(
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
          "Academic deleted successfully",
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "DELETE_ACADEMIC_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete academic",
      },
      {
        status: 500,
      }
    );
  }
}