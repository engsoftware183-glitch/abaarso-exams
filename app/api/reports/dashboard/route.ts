import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { ResultStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const [totalStudents, totalCourses, totalExams, publishedResults] = await Promise.all([
      prisma.student.count(),
      prisma.course.count(),
      prisma.exam.count(),
      prisma.result.count({
        where: {
          status: ResultStatus.PUBLISHED,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          totalStudents,
          totalCourses,
          totalExams,
          publishedResults,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return prismaErrorResponse(error, "Failed to fetch dashboard report aggregates");
  }
}
