import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// ASSIGN COURSE
// ======================================================

export async function POST(
  req: NextRequest
) {
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
      course_id,
      department_id,
      semester_id,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !course_id ||
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
    // UPDATE COURSE
    // =========================================

    const course =
      await prisma.course.update({

        where: {
          course_id:
            Number(course_id),
        },

        data: {

          department_id:
            Number(department_id),

          semester_id:
            Number(semester_id),
        },

      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Course assigned successfully",

        course,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "ASSIGN_COURSE_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to assign course",
      },
      {
        status: 500,
      }
    );
  }
}