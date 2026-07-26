import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// BULK UPLOAD ACADEMICS
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

    const { academics } =
      body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !academics ||
      !Array.isArray(
        academics
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Academics array is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // FORMAT ACADEMICS
    // =========================================

    const formattedAcademics =
      academics.map(
        (
          academic: {
            year: string;
          }
        ) => ({

          year:
            String(
              academic.year
            ),
        })
      );

    // =========================================
    // CREATE MANY ACADEMICS
    // =========================================

    const createdAcademics =
      await prisma.academic.createMany({

        data:
          formattedAcademics,

        skipDuplicates: true,
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Academics uploaded successfully",

        count:
          createdAcademics.count,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "BULK_ACADEMICS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to upload academics");
  }
}
