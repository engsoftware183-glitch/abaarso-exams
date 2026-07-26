import { NextRequest, NextResponse } from "next/server";
import { ResultStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// SEARCH TRANSCRIPTS
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
    // GET SEARCH QUERY
    // =========================================

    const keyword =
      req.nextUrl.searchParams.get("keyword") || "";

    // =========================================
    // SEARCH STUDENTS
    // =========================================

    const students = await prisma.student.findMany({
      where: {
        AND: [
          {
            results: {
              some: {
                status: ResultStatus.PUBLISHED,
              },
            },
          },

          {
            OR: [
              {
                full_name: {
                  contains: keyword,
                  mode: "insensitive",
                },
              },

              {
                roll_no: {
                  contains: keyword,
                  mode: "insensitive",
                },
              },

              {
                email: {
                  contains: keyword,
                  mode: "insensitive",
                },
              },

              {
                faculty: {
                  faculty_name: {
                    contains: keyword,
                    mode: "insensitive",
                  },
                },
              },

              {
                department: {
                  department_name: {
                    contains: keyword,
                    mode: "insensitive",
                  },
                },
              },
            ],
          },
        ],
      },

      include: {
        faculty: {
          select: {
            faculty_name: true,
          },
        },

        department: {
          select: {
            department_name: true,
          },
        },

        academic: {
          select: {
            year: true,
          },
        },

        results: {
          where: {
            status: ResultStatus.PUBLISHED,
          },

          include: {
            course: {
              select: {
                credit_hours: true,
              },
            },
          },
        },
      },

      orderBy: {
        student_id: "desc",
      },
    });

    // =========================================
    // CALCULATE TRANSCRIPT SUMMARY
    // =========================================

    const transcripts = students.map((student) => {
      let totalCreditHours = 0;
      let totalGpaPoints = 0;

      for (const result of student.results) {
        totalCreditHours += result.course.credit_hours;
        totalGpaPoints +=
          result.gpa * result.course.credit_hours;
      }

      const cgpa =
        totalCreditHours > 0
          ? Number(
              (
                totalGpaPoints /
                totalCreditHours
              ).toFixed(2)
            )
          : 0;

      return {
        student_id: student.student_id,

        full_name: student.full_name,

        roll_no: student.roll_no,

        email: student.email,

        faculty:
          student.faculty.faculty_name,

        department:
          student.department.department_name,

        academic_year:
          student.academic.year,

        total_courses:
          student.results.length,

        total_credit_hours:
          totalCreditHours,

        cgpa,
      };
    });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        count: transcripts.length,

        transcripts,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log(
      "SEARCH_TRANSCRIPTS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to search transcripts");
  }
}