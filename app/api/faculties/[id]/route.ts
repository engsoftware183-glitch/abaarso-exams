import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


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

    return prismaErrorResponse(error, "Failed to fetch faculty");
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

    return prismaErrorResponse(error, "Failed to update faculty");
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

    return prismaErrorResponse(error, "Failed to delete faculty");
  }
}
