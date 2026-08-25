import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";


// ======================================================
// GET ALL FACULTIES
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

    return prismaErrorResponse(error, "Failed to fetch faculties");
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

    void logActivity("CREATE_FACULTY", `Created faculty ${faculty_name}`);

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

    return prismaErrorResponse(error, "Failed to create faculty");
  }
}
