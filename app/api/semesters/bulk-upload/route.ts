import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


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

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
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

    return prismaErrorResponse(error, "Failed to upload semesters");
  }
}
