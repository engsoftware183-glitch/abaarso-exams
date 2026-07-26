import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// BULK UPLOAD FACULTIES
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

    const { faculties } =
      body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !faculties ||
      !Array.isArray(
        faculties
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Faculties array is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // FORMAT FACULTIES
    // =========================================

    const formattedFaculties =
      faculties.map(
        (
          faculty: {
            faculty_name:
              string;
          }
        ) => ({

          faculty_name:
            String(
              faculty.faculty_name
            ),
        })
      );

    // =========================================
    // CREATE MANY FACULTIES
    // =========================================

    const createdFaculties =
      await prisma.faculty.createMany({

        data:
          formattedFaculties,

        skipDuplicates: true,
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Faculties uploaded successfully",

        count:
          createdFaculties.count,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "BULK_FACULTIES_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to upload faculties");
  }
}
