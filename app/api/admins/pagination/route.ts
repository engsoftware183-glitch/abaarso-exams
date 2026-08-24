import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// PAGINATION ADMINS
// ======================================================

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

    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 10));
    const search = req.nextUrl.searchParams.get("search")?.trim();

    const skip = (page - 1) * limit;

    // =========================================
    // WHERE CLAUSE
    // =========================================

    const where: Prisma.AdminWhereInput = {
      ...(search
        ? {
            user: {
              OR: [
                { username: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    };

    // =========================================
    // GET ADMINS
    // =========================================

    const admins =
      await prisma.admin.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
              role: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

    // =========================================
    // TOTAL
    // =========================================

    const total =
      await prisma.admin.count({ where });

    return NextResponse.json(
      {
        success: true,
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        admins,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "PAGINATION_ADMINS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to paginate admins");
  }
}
