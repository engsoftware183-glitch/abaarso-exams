import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";


// ======================================================
// BULK UPLOAD ACADEMICS
// ======================================================

export async function POST(
  req: NextRequest
) {
  try {

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

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to upload academics",
      },
      {
        status: 500,
      }
    );
  }
}