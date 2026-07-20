import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// GET ALL FACULTIES
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
    // GET FACULTIES
    // =========================================

    const faculties =
      await prisma.faculty.findMany({

        orderBy: {
          faculty_name: "asc",
        },

      });

    return NextResponse.json(
      {
        success: true,
        count: faculties.length,
        faculties,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_FACULTIES_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch faculties",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// CREATE FACULTY
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

    const {
      faculty_name,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (!faculty_name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty name is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // CHECK EXISTING
    // =========================================

    const existingFaculty =
      await prisma.faculty.findFirst({
        where: {
          faculty_name,
        },
      });

    if (existingFaculty) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty already exists",
        },
        {
          status: 409,
        }
      );
    }

    // =========================================
    // CREATE FACULTY
    // =========================================

    const faculty =
      await prisma.faculty.create({
        data: {
          faculty_name,
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Faculty created successfully",

        faculty,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "CREATE_FACULTY_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create faculty",
      },
      {
        status: 500,
      }
    );
  }
}