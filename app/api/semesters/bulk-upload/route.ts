import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  verifyToken,
} from "@/lib/auth";


// ======================================================
// BULK UPLOAD SEMESTERS
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

    const { semesters } =
      body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !semesters ||
      !Array.isArray(
        semesters
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Semesters array is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // FORMAT SEMESTERS
    // =========================================

    const formattedSemesters =
      semesters.map(
        (
          semester: {
            semester_name:
              string;

            academic_id:
              number;

            faculty_id:
              number;
          }
        ) => ({

          semester_name:
            String(
              semester.semester_name
            ),

          academic_id:
            Number(
              semester.academic_id
            ),

          faculty_id:
            Number(
              semester.faculty_id
            ),
        })
      );

    // =========================================
    // CREATE MANY SEMESTERS
    // =========================================

    const createdSemesters =
      await prisma.semester.createMany({

        data:
          formattedSemesters,

        skipDuplicates: true,
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Semesters uploaded successfully",

        count:
          createdSemesters.count,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "BULK_SEMESTERS_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to upload semesters",
      },
      {
        status: 500,
      }
    );
  }
}