import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// PAGINATION SEMESTERS
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
    const academicId = req.nextUrl.searchParams.get("academic_id")?.trim();
    const facultyId = req.nextUrl.searchParams.get("faculty_id")?.trim();

    const skip = (page - 1) * limit;

    // =========================================
    // WHERE CLAUSE
    // =========================================

    const where: Prisma.SemesterWhereInput = {
      ...(search
        ? {
            semester_name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {}),
      ...(academicId ? { academic_id: Number(academicId) } : {}),
      ...(facultyId ? { faculty_id: Number(facultyId) } : {}),
    };

    // =========================================
    // GET SEMESTERS
    // =========================================

    const semesters =
      await prisma.semester.findMany({
        where,
        skip,
        take: limit,
        include: {
          academic: true,
          faculty: true,
          _count: {
            select: {
              courses: true,
              students: true,
            },
          },
        },
        orderBy: {
          semester_name: "asc",
        },
      });

    // =========================================
    // TOTAL
    // =========================================

    const total =
      await prisma.semester.count({ where });

    return NextResponse.json(
      {
        success: true,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        semesters,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "PAGINATION_SEMESTERS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to paginate semesters");
  }
}
