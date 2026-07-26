import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// GET ALL DEPARTMENTS
// ======================================================

export async function GET(req: NextRequest) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
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

    return prismaErrorResponse(error, "Failed to fetch departments");
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

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
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

    return prismaErrorResponse(error, "Failed to create department");
  }
}
