import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// GET ALL DEPARTMENTS
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
    // GET DEPARTMENTS
    // =========================================

    const departments =
      await prisma.department.findMany({

        include: {
          faculty: true,
        },

        orderBy: {
          department_name: "asc",
        },

      });

    return NextResponse.json(
      {
        success: true,
        count: departments.length,
        departments,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_DEPARTMENTS_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch departments",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// CREATE DEPARTMENT
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
      department_name,
      faculty_id,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !department_name ||
      !faculty_id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Department name and faculty are required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // CHECK FACULTY
    // =========================================

    const faculty =
      await prisma.faculty.findUnique({
        where: {
          faculty_id:
            Number(faculty_id),
        },
      });

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
    // CHECK EXISTING
    // =========================================

    const existingDepartment =
      await prisma.department.findFirst({
        where: {
          department_name,
        },
      });

    if (existingDepartment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Department already exists",
        },
        {
          status: 409,
        }
      );
    }

    // =========================================
    // CREATE DEPARTMENT
    // =========================================

    const department =
      await prisma.department.create({

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
          "Department created successfully",

        department,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "CREATE_DEPARTMENT_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create department",
      },
      {
        status: 500,
      }
    );
  }
}