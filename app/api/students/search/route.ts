import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { verifyToken } from "@/lib/auth";


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

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
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
          message: "Invalid token",
        },
        {
          status: 401,
        }
      );
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

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to search students",
      },
      {
        status: 500,
      }
    );
  }
}