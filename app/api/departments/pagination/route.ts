import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// PAGINATION DEPARTMENTS
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
    const facultyId = req.nextUrl.searchParams.get("faculty_id")?.trim();

    const skip = (page - 1) * limit;

    // =========================================
    // WHERE CLAUSE
    // =========================================

    const where: Prisma.DepartmentWhereInput = {
      ...(search
        ? {
            department_name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {}),
      ...(facultyId ? { faculty_id: Number(facultyId) } : {}),
    };

    // =========================================
    // GET DEPARTMENTS
    // =========================================

    const departments =
      await prisma.department.findMany({
        where,
        skip,
        take: limit,
        include: {
          faculty: true,
          _count: {
            select: {
              courses: true,
              students: true,
            },
          },
        },
        orderBy: {
          department_name: "asc",
        },
      });

    // =========================================
    // TOTAL
    // =========================================

    const total =
      await prisma.department.count({ where });

    return NextResponse.json(
      {
        success: true,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        departments,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "PAGINATION_DEPARTMENTS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to paginate departments");
  }
}
