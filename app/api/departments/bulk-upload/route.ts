import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// BULK UPLOAD DEPARTMENTS
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

    const { departments } =
      body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !departments ||
      !Array.isArray(
        departments
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Departments array is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // FORMAT DEPARTMENTS
    // =========================================

    const formattedDepartments =
      departments.map(
        (
          department: {
            department_name:
              string;

            faculty_id:
              number;
          }
        ) => ({

          department_name:
            String(
              department.department_name
            ),

          faculty_id:
            Number(
              department.faculty_id
            ),
        })
      );

    // =========================================
    // CREATE MANY DEPARTMENTS
    // =========================================

    const createdDepartments =
      await prisma.department.createMany({

        data:
          formattedDepartments,

        skipDuplicates: true,
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Departments uploaded successfully",

        count:
          createdDepartments.count,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "BULK_DEPARTMENTS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to upload departments");
  }
}
