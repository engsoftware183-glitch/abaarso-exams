import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// BULK UPLOAD COURSES
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
    // GET BODY
    // =========================================

    const body =
      await req.json();

    const { courses } =
      body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !courses ||
      !Array.isArray(
        courses
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Courses array is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // FORMAT COURSES
    // =========================================

    const formattedCourses =
      courses.map(
        (
          course: {
            course_name:
              string;

            course_code:
              string;

            credit_hours:
              number;

            description:
              string;

            department_id:
              number;

            semester_id:
              number;
          }
        ) => ({

          course_name:
            String(
              course.course_name
            ),

          course_code:
            String(
              course.course_code
            ),

          credit_hours:
            Number(
              course.credit_hours
            ),

          description:
            String(
              course.description
            ),

          department_id:
            Number(
              course.department_id
            ),

          semester_id:
            Number(
              course.semester_id
            ),
        })
      );

    // =========================================
    // CREATE MANY COURSES
    // =========================================

    const createdCourses =
      await prisma.course.createMany({

        data:
          formattedCourses,

        skipDuplicates: true,
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Courses uploaded successfully",

        count:
          createdCourses.count,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "BULK_COURSES_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to upload courses");
  }
}
