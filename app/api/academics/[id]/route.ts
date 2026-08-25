import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";


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

    return prismaErrorResponse(error, "Failed to fetch academic");
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

    void logActivity("UPDATE_ACADEMIC", `Updated academic year to ${year}`);

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

    return prismaErrorResponse(error, "Failed to update academic");
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
    // DELETE ACADEMIC
    // =========================================

    await prisma.academic.delete({
      where: {
        academic_id: Number(
          params.id
        ),
      },
    });

    void logActivity("DELETE_ACADEMIC", `Deleted academic year ID ${Number(params.id)}`);

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

    return prismaErrorResponse(error, "Failed to delete academic");
  }
}
