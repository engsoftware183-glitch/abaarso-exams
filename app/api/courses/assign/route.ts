import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


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

    return prismaErrorResponse(error, "Failed to assign course");
  }
}
