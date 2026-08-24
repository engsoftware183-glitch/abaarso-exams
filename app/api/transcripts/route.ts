import { NextRequest, NextResponse } from "next/server";
import { ResultStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = await requireStudentScope(req);

    if (!auth.ok) {
      return auth.response;
    }

    // Fetch students that have at least one PUBLISHED result.
    // Sorted by student_id descending.
    const students = await prisma.student.findMany({
      where: {
        ...(auth.student
          ? { student_id: auth.student.student_id }
          : {}),

        results: {
          some: {
            status: ResultStatus.PUBLISHED,
          },
        },
      },
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
    });

    // Transform and map students to their transcript summary
    const transcripts = students.map((student) => {
      let totalCreditHours = 0;
      let sumGpaCredits = 0;
      const totalCourses = student.results.length;

      for (const result of student.results) {
        const creditHours = result.course.credit_hours;
        totalCreditHours += creditHours;
        sumGpaCredits += result.gpa * creditHours;
      }

      const cgpa =
        totalCreditHours > 0
          ? Number((sumGpaCredits / totalCreditHours).toFixed(2))
          : 0;

      return {
        student_id: student.student_id,
        full_name: student.full_name,
        roll_no: student.roll_no,
        email: student.email,
        faculty: student.faculty.faculty_name,
        department: student.department.department_name,
        academic_year: student.academic.year,
        total_courses: totalCourses,
        total_credit_hours: totalCreditHours,
        cgpa: cgpa,
      };
    });

    // Return successful JSON response
    return NextResponse.json(
      {
        success: true,
        count: transcripts.length,
        transcripts: transcripts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching transcripts list:", error);
    return prismaErrorResponse(error, "Failed to fetch transcripts");
  }
}
