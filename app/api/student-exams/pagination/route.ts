import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
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

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // QUERY PARAMS
    // =========================================

    const searchParams =
      req.nextUrl.searchParams;

    const page = Number(
      searchParams.get("page") || 1
    );

    const limit = Number(
      searchParams.get("limit") || 10
    );

    const skip =
      (page - 1) * limit;

    // =========================================
    // TOTAL RECORDS
    // =========================================

    const totalRecords =
      await prisma.studentExam.count();

    // =========================================
    // GET DATA
    // =========================================

    const studentExams =
      await prisma.studentExam.findMany({

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
