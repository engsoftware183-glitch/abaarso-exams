import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


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
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

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

    return prismaErrorResponse(error, "Failed to fetch department");
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
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // GET PARAMS
    // =========================================

    const params =
      await context.params;

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

    return prismaErrorResponse(error, "Failed to update department");
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
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // GET PARAMS
    // =========================================

    const params =
      await context.params;

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

    return prismaErrorResponse(error, "Failed to delete department");
  }
}
