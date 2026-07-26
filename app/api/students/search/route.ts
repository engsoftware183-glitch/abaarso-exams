import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// SEARCH STUDENTS
// ======================================================

export async function GET(
  req: NextRequest
) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // SEARCH PARAM
    // =========================================

    const search =
      req.nextUrl.searchParams.get("search");

    // =========================================
    // SEARCH STUDENTS
    // =========================================

    const students =
      await prisma.student.findMany({

        where: ({
          OR: [

            {
              full_name: {
                contains:
                  search || "",
                mode: "insensitive",
              },
            },

            {
              roll_no: {
                contains:
                  search || "",
                mode: "insensitive",
              },
            },

            {
              email: {
                contains:
                  search || "",
                mode: "insensitive",
              },
            },

          ],
        } as Prisma.StudentWhereInput),

        include: {
          academic: true,
          faculty: true,
          department: true,
          semester: true,
        },

      });

    return NextResponse.json(
      {
        success: true,

        count: students.length,

        students,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "SEARCH_STUDENTS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to search students");
  }
}