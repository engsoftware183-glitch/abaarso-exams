import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// GET CURRENT USER
// ======================================================

export async function GET(
  req: NextRequest
) {
  try {

    // =========================================
    // GET AUTHORIZATION HEADER
    // =========================================

    const authHeader =
      req.headers.get("authorization");

    // =========================================
    // CHECK TOKEN
    // =========================================

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

    // =========================================
    // EXTRACT TOKEN
    // =========================================

    const token =
      authHeader.split(" ")[1];

    // =========================================
    // VERIFY TOKEN
    // =========================================

    const decoded =
      verifyToken(token);

    // =========================================
    // INVALID TOKEN
    // =========================================

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
    // FIND USER
    // =========================================

    const user =
      await prisma.user.findUnique({
        where: {
          user_id: Number(decoded.id),
        },

        select: {
          user_id: true,

          username: true,

          email: true,

          role: true,

          created_at: true,

          updated_at: true,
        },
      });

    // =========================================
    // USER NOT FOUND
    // =========================================

    if (!user) {
      return NextResponse.json(
        {
          success: false,

          message:
            "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // =========================================
    // SUCCESS RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        user,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "ME_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}