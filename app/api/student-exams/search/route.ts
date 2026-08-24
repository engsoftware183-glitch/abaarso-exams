import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// SEARCH STUDENT EXAMS
// ======================================================

export async function GET(req: NextRequest) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = await requireStudentScope(req);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // GET SEARCH QUERY
    // =========================================

    const searchParams = req.nextUrl.searchParams;

    const query =
      searchParams.get("query") || "";

    // =========================================
    // SEARCH STUDENT EXAMS
    // =========================================

    const studentExams =
      await prisma.studentExam.findMany({
        where: {
          ...(auth.student
            ? { student_id: auth.student.student_id }
            : {}),

          OR: [
            {
              student: {
                full_name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
            {
              student: {
                roll_no: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
            {
              exam: {
                course: {
                  course_name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              exam: {
                course: {
                  course_code: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            },

          ],
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
            include: {
              course: {
                select: {
                  course_name: true,
                  course_code: true,
                },
              },
            },
          },
        },

        orderBy: {
          student_exam_id: "desc",
        },
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,
        count: studentExams.length,
        studentExams,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log(
      "SEARCH_STUDENT_EXAMS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to search student exams");
  }
}
