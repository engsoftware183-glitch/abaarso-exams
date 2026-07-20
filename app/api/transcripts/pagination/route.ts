import { NextRequest, NextResponse } from "next/server";
import { ResultStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ======================================================
// PAGINATION TRANSCRIPTS
// ======================================================

export async function GET(
  req: NextRequest
) {
  try {

    // =========================================
    // QUERY PARAMETERS
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
      await prisma.student.count({
        where: {
          results: {
            some: {
              status:
                ResultStatus.PUBLISHED,
            },
          },
        },
      });

    // =========================================
    // GET STUDENTS
    // =========================================

    const students =
      await prisma.student.findMany({

        where: {
          results: {
            some: {
              status:
                ResultStatus.PUBLISHED,
            },
          },
        },

        skip,

        take: limit,

        orderBy: {
          student_id: "desc",
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
              status:
                ResultStatus.PUBLISHED,
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

      });

    // =========================================
    // CALCULATE TRANSCRIPTS
    // =========================================

    const transcripts =
      students.map((student) => {

        let totalCreditHours = 0;

        let totalGpaPoints = 0;

        for (const result of student.results) {

          totalCreditHours +=
            result.course.credit_hours;

          totalGpaPoints +=
            result.gpa *
            result.course.credit_hours;
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

          student_id:
            student.student_id,

          full_name:
            student.full_name,

          roll_no:
            student.roll_no,

          email:
            student.email,

          faculty:
            student.faculty
              .faculty_name,

          department:
            student.department
              .department_name,

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

        currentPage: page,

        perPage: limit,

        totalRecords,

        totalPages: Math.ceil(
          totalRecords / limit
        ),

        transcripts,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "PAGINATION_TRANSCRIPTS_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );

  }
}