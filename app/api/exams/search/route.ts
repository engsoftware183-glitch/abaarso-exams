import { NextRequest, NextResponse } from "next/server";
import { ExamType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStudentScope, examScopeWhere } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// SEARCH EXAMS
// ======================================================

export async function GET(
  req: NextRequest
) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = await requireStudentScope(req);

    if (!auth.ok) {
      return auth.response;
    }

    const keyword =
      req.nextUrl.searchParams.get(
        "keyword"
      ) || "";

    const exams =
      await prisma.exam.findMany({
        where: {
          ...(examScopeWhere(auth.student) ?? {}),

          OR: [
            {
              exam_type: {
                equals:
                  keyword as ExamType,
              },
            },

            {
              course: {
                course_name: {
                  contains:
                    keyword,
                  mode:
                    "insensitive",
                },
              },
            },

            {
              course: {
                course_code: {
                  contains:
                    keyword,
                  mode:
                    "insensitive",
                },
              },
            },
          ],
        },

        include: {
          academic: true,

          faculty: true,

          semester: true,

          course: true,
        },

        orderBy: {
          exam_id: "desc",
        },
      });

    return NextResponse.json(
      {
        success: true,

        total:
          exams.length,

        exams,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(
      "SEARCH_EXAM_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to search exams");
  }
}
