import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";


// ======================================================
// GET SINGLE SEMESTER
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
    // FIND SEMESTER
    // =========================================

    const semester =
      await prisma.semester.findUnique({

        where: {
          semester_id:
            Number(params.id),
        },

        include: {
          academic: true,
          faculty: true,
        },

      });

    // =========================================
    // NOT FOUND
    // =========================================

    if (!semester) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Semester not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        semester,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_SINGLE_SEMESTER_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch semester");
  }
}


// ======================================================
// UPDATE SEMESTER
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
      semester_name,
      academic_id,
      faculty_id,
    } = body;

    // =========================================
    // UPDATE SEMESTER
    // =========================================

    const semester =
      await prisma.semester.update({

        where: {
          semester_id:
            Number(params.id),
        },

        data: {
          semester_name,
          academic_id:
            Number(academic_id),
          faculty_id:
            Number(faculty_id),
        },

        include: {
          academic: true,
          faculty: true,
        },

      });

    void logActivity("UPDATE_SEMESTER", `Updated semester ${semester_name}`);

    return NextResponse.json(
      {
        success: true,

        message:
          "Semester updated successfully",

        semester,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "UPDATE_SEMESTER_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to update semester");
  }
}


// ======================================================
// DELETE SEMESTER
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
    // DELETE SEMESTER
    // =========================================

    await prisma.semester.delete({
      where: {
        semester_id:
          Number(params.id),
      },
    });

    void logActivity("DELETE_SEMESTER", `Deleted semester ID ${Number(params.id)}`);

    return NextResponse.json(
      {
        success: true,

        message:
          "Semester deleted successfully",
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "DELETE_SEMESTER_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to delete semester");
  }
}
