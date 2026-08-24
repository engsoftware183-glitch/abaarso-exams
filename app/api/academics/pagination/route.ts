import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// PAGINATION ACADEMICS
// ======================================================

export async function GET(req: NextRequest) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req);

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

    const where: Prisma.AcademicWhereInput = {
      ...(search
        ? {
            year: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {}),
    };

    // =========================================
    // GET ACADEMICS
    // =========================================

    const academics =
      await prisma.academic.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              semesters: true,
              students: true,
            },
          },
        },
        orderBy: {
          year: "desc",
        },
      });

    // =========================================
    // TOTAL
    // =========================================

    const total =
      await prisma.academic.count({ where });

    return NextResponse.json(
      {
        success: true,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        academics,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "PAGINATION_ACADEMICS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to paginate academics");
  }
}
