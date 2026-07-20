import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// GET ALL SEMESTERS
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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch semesters",
      },
      {
        status: 500,
      }
    );
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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create semester",
      },
      {
        status: 500,
      }
    );
  }
}