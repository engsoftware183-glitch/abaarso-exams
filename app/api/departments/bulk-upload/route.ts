import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  verifyToken,
} from "@/lib/auth";


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

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to upload departments",
      },
      {
        status: 500,
      }
    );
  }
}