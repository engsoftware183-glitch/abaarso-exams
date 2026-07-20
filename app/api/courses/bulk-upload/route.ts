import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  verifyToken,
} from "@/lib/auth";


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

    const authHeader =
      req.headers.get(
        "authorization"
      );

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Unauthorized",
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

          message:
            "Invalid token",
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
      decoded.role !==
        "SUPER_ADMIN" &&
      decoded.role !==
        "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Access denied",
        },
        {
          status: 403,
        }
      );
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

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to upload courses",
      },
      {
        status: 500,
      }
    );
  }
}