import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// PAGINATION STUDENTS
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
    // QUERY PARAMS
    // =========================================

    const page =
      Number(
        req.nextUrl.searchParams.get("page")
      ) || 1;

    const limit =
      Number(
        req.nextUrl.searchParams.get("limit")
      ) || 10;

    const skip =
      (page - 1) * limit;

    // =========================================
    // GET STUDENTS
    // =========================================

    const students =
      await prisma.student.findMany({

        skip,
        take: limit,

        include: {
          academic: true,
          faculty: true,
          department: true,
          semester: true,
        },

        orderBy: {
          created_at: "desc",
        },

      });

    // =========================================
    // TOTAL
    // =========================================

    const total =
      await prisma.student.count();

    return NextResponse.json(
      {
        success: true,

        page,

        limit,

        total,

        totalPages:
          Math.ceil(total / limit),

        students,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "PAGINATION_STUDENTS_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to paginate students",
      },
      {
        status: 500,
      }
    );
  }
}