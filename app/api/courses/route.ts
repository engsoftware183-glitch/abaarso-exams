import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// ======================================================
// GET ALL COURSES
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
    // GET COURSES
    // =========================================

    const courses =
      await prisma.course.findMany({

        include: {
          department: true,
          semester: true,
        },

        orderBy: {
          created_at: "desc",
        },

      });

    return NextResponse.json(
      {
        success: true,

        count: courses.length,

        courses,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_COURSES_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to fetch courses",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// CREATE COURSE
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
      course_name,
      course_code,
      credit_hours,
      description,
      department_id,
      semester_id,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !course_name ||
      !course_code ||
      credit_hours === undefined ||
      !department_id ||
      !semester_id
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
    // CHECK EXISTING COURSE
    // =========================================

    const existingCourse =
      await prisma.course.findUnique({
        where: {
          course_code,
        },
      });

    if (existingCourse) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Course already exists",
        },
        {
          status: 409,
        }
      );
    }

    // =========================================
    // CHECK DEPARTMENT
    // =========================================

    const department =
      await prisma.department.findUnique({
        where: {
          department_id:
            Number(department_id),
        },
      });

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

    // =========================================
    // CHECK SEMESTER
    // =========================================

    const semester =
      await prisma.semester.findUnique({
        where: {
          semester_id:
            Number(semester_id),
        },
      });

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

    // =========================================
    // CREATE COURSE
    // =========================================

    const course =
      await prisma.course.create({

        data: {
          course_name,

          course_code,

          credit_hours:
            Number(credit_hours),

          description,

          department_id:
            Number(department_id),

          semester_id:
            Number(semester_id),
        },

        include: {
          department: true,
          semester: true,
        },

      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Course created successfully",

        course,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "CREATE_COURSE_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to create course",
      },
      {
        status: 500,
      }
    );
  }
}