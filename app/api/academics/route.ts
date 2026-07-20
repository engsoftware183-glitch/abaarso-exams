import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// GET ALL ACADEMICS
// ======================================================

export async function GET(req: NextRequest) {
  try {

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
    // GET ACADEMICS
    // =========================================

    const academics =
      await prisma.academic.findMany({

        orderBy: {
          year: "desc",
        },

      });

    return NextResponse.json(
      {
        success: true,
        count: academics.length,
        academics,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_ACADEMICS_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch academics",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// CREATE ACADEMIC
// ======================================================

export async function POST(req: NextRequest) {
  try {

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
    // VALIDATION
    // =========================================

    if (!year) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Year is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // CHECK EXISTING
    // =========================================

    const existingAcademic =
      await prisma.academic.findFirst({
        where: {
          year,
        },
      });

    if (existingAcademic) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Academic already exists",
        },
        {
          status: 409,
        }
      );
    }

    // =========================================
    // CREATE ACADEMIC
    // =========================================

    const academic =
      await prisma.academic.create({
        data: {
          year,
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Academic created successfully",

        academic,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "CREATE_ACADEMIC_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create academic",
      },
      {
        status: 500,
      }
    );
  }
}