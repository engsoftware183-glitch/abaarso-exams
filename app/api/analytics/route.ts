import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { ResultStatus } from "@prisma/client";

// ======================================================
// GET ANALYTICS OVERVIEW
// ======================================================

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    const [
      totalStudents,
      totalCourses,
      examsConducted,
      publishedResults,
      gpaBySemester,
      semesters,
      gradeGroups,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.course.count(),
      prisma.exam.count({
        where: {
          exam_date: {
            lte: new Date(),
          },
        },
      }),
      prisma.result.count({
        where: {
          status: ResultStatus.PUBLISHED,
        },
      }),
      prisma.result.groupBy({
        by: ["semester_id"],
        _avg: {
          gpa: true,
        },
      }),
      prisma.semester.findMany({
        select: {
          semester_id: true,
          semester_name: true,
        },
      }),
      prisma.result.groupBy({
        by: ["grade"],
        _count: {
          grade: true,
        },
        where: {
          grade: {
            not: null,
          },
        },
      }),
    ]);

    const semesterNameById = new Map(
      semesters.map((semester) => [semester.semester_id, semester.semester_name])
    );

    const performance = {
      labels: gpaBySemester.map(
        (row) => semesterNameById.get(row.semester_id) ?? `Semester ${row.semester_id}`
      ),
      values: gpaBySemester.map((row) => row._avg.gpa ?? 0),
    };

    const distribution = {
      labels: gradeGroups
        .map((row) => row.grade)
        .filter((grade): grade is string => grade !== null),
      values: gradeGroups.map((row) => row._count.grade),
    };

    return NextResponse.json(
      {
        data: {
          totalStudents,
          totalCourses,
          examsConducted,
          publishedResults,
          performance,
          distribution,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("GET_ANALYTICS_ERROR", error);

    return prismaErrorResponse(error, "Failed to fetch analytics");
  }
}

