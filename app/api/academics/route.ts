import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";


// ======================================================
// GET ALL ACADEMICS
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

    return prismaErrorResponse(error, "Failed to fetch academics");
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

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
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

    void logActivity("CREATE_ACADEMIC", `Created academic year ${year}`);

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

    return prismaErrorResponse(error, "Failed to create academic");
  }
}
