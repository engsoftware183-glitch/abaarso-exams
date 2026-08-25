import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";


// ======================================================
// GET ALL SEMESTERS
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
    // GET SEMESTERS
    // =========================================

    const semesters =
      await prisma.semester.findMany({

        include: {
          academic: true,
          faculty: true,
        },

        orderBy: {
          semester_name: "asc",
        },

      });

    return NextResponse.json(
      {
        success: true,
        count: semesters.length,
        semesters,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_SEMESTERS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch semesters");
  }
}


// ======================================================
// CREATE SEMESTER
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
      semester_name,
      academic_id,
      faculty_id,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !semester_name ||
      !academic_id ||
      !faculty_id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All fields are required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // CHECK ACADEMIC
    // =========================================

    const academic =
      await prisma.academic.findUnique({
        where: {
          academic_id:
            Number(academic_id),
        },
      });

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
    // CREATE SEMESTER
    // =========================================

    const semester =
      await prisma.semester.create({

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

    void logActivity("CREATE_SEMESTER", `Created semester ${semester_name}`);

    return NextResponse.json(
      {
        success: true,

        message:
          "Semester created successfully",

        semester,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "CREATE_SEMESTER_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to create semester");
  }
}
