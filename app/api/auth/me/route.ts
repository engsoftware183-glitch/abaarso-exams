import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { logError } from "@/lib/logger";


// ======================================================
// GET CURRENT USER
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
    // FIND USER
    // =========================================

    const user =
      await prisma.user.findUnique({
        where: {
          user_id: Number(auth.decoded.id),
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

    logError("ME_ERROR", error);

    return prismaErrorResponse(error, "Failed to fetch current user");
  }
}
