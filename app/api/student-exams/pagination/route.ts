import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// PAGINATION STUDENT EXAMS
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

    // =========================================
    // QUERY PARAMS
    // =========================================

    const searchParams =
      req.nextUrl.searchParams;

    const page = Math.max(1, Number(
      searchParams.get("page") || 1
    ));

    const limit = Math.min(100, Math.max(1, Number(
      searchParams.get("limit") || 10
    )));

    const skip =
      (page - 1) * limit;

    const search = searchParams.get("search")?.trim();
    const examId = searchParams.get("exam_id")?.trim();

    // =========================================
    // WHERE CLAUSE
    // =========================================

    const where: Prisma.StudentExamWhereInput = {
      ...(auth.student
        ? { student_id: auth.student.student_id }
        : {}),

      ...(search
        ? {
            OR: [
              {
                student: {
                  full_name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                student: {
                  roll_no: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                exam: {
                  course: {
                    course_name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                exam: {
                  course: {
                    course_code: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : {}),

      ...(examId ? { exam_id: Number(examId) } : {}),
    };

    const totalRecords =
      await prisma.studentExam.count({ where });

    // =========================================
    // GET DATA
    // =========================================

    const studentExams =
      await prisma.studentExam.findMany({

        where,

        skip,

        take: limit,

        orderBy: {
          student_exam_id: "desc",
        },

        include: {

          student: {
            select: {
              student_id: true,
              full_name: true,
              roll_no: true,
            },
          },

          exam: {

            select: {

              exam_id: true,

              exam_type: true,

              total_marks: true,

              exam_date: true,

              course: {
                select: {
                  course_id: true,
                  course_name: true,
                  course_code: true,
                },
              },
            },
          },
        },
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        currentPage: page,

        perPage: limit,

        total: totalRecords,

        totalRecords,

        totalPages: Math.ceil(
          totalRecords / limit
        ),

        studentExams,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "PAGINATION_STUDENT_EXAMS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to paginate student exams");
  }
}
