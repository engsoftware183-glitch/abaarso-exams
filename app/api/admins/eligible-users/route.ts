import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// ELIGIBLE USERS FOR ADMIN PROMOTION
// ======================================================
//
// Backs the "select an existing user" combobox on the Administrators
// page. Only users who do not already have an Admin relation and are
// not already SUPER_ADMIN are eligible - this keeps duplicate Admin
// relations and accidental re-promotion out of the picker entirely,
// on top of the same checks being re-verified server-side on submit.
// The signed-in SUPER_ADMIN is excluded so self-promotion is never
// even offered as an option.

export async function GET(req: NextRequest) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // QUERY PARAMS
    // =========================================

    const search = req.nextUrl.searchParams.get("search")?.trim();

    // =========================================
    // WHERE CLAUSE
    // =========================================

    const where: Prisma.UserWhereInput = {
      admin: null,
      role: { not: "SUPER_ADMIN" },
      user_id: { not: auth.decoded.user_id },
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    // =========================================
    // GET ELIGIBLE USERS
    // =========================================

    const users =
      await prisma.user.findMany({
        where,
        select: {
          user_id: true,
          username: true,
          email: true,
          role: true,
        },
        orderBy: {
          username: "asc",
        },
        take: 20,
      });

    return NextResponse.json(
      {
        success: true,
        count: users.length,
        users,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "ELIGIBLE_USERS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch eligible users");
  }
}
