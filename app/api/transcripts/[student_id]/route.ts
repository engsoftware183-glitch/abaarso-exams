

import { NextResponse } from "next/server";
import { ResultStatus, ExamType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


export async function GET(
  request: Request,
  context: { params: Promise<{ student_id: string }> }
) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { student_id } = await context.params;

    // 1. Validate student_id
    const studentId = parseInt(student_id, 10);
    if (!student_id || isNaN(studentId) || studentId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid student ID. It must be a positive integer.",
        },
        { status: 400 }
      );
    }

    // 2. Fetch student information and relations in a single optimized query
    const student = await prisma.student.findUnique({
      where: { student_id: studentId },
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
                course_id: true,
                course_name: true,
                course_code: true,
                credit_hours: true,
              },
            },
            semester: {
              select: {
                semester_id: true,
                semester_name: true,
              },
            },
          },
        },
        attendances: {
          select: {
            course_id: true,
            attendance_mark: true,
          },
        },
        assessments: {
          select: {
            course_id: true,
            assignment_mark: true,
            quiz_mark: true,
          },
        },
       studentExams: {
  select: {
    marks: true,
    exam: {
      select: {
        course_id: true,
        semester_id: true,
        exam_type: true,
      },
    },
  },
},
      },
    });

    // 3. Return 404 if the student does not exist
    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: "Student not found.",
        },
        { status: 404 }
      );
    }

    // 4. Group courses by Semester
    const semesterMap = new Map<
      number,
      {
        semester_name: string;
        courses: Array<{
          course_name: string;
          course_code: string;
          credit_hours: number;
          attendance_mark: number;
          assignment_mark: number;
          quiz_mark: number;
          midterm_mark: number;
          final_mark: number;
          total_marks: number;
          grade: string | null;
          gpa: number;
        }>;
      }
    >();

    for (const result of student.results) {
      const semesterId = result.semester_id;
      const semesterName = result.semester.semester_name;

      if (!semesterMap.has(semesterId)) {
        semesterMap.set(semesterId, {
          semester_name: semesterName,
          courses: [],
        });
      }

      // Map corresponding attendance
      const attendance = student.attendances.find(
        (a) => a.course_id === result.course_id
      );
      const attendanceMark = attendance ? attendance.attendance_mark : 0;

      // Map corresponding assessments
      const assessment = student.assessments.find(
        (a) => a.course_id === result.course_id
      );
      const assignmentMark = assessment ? assessment.assignment_mark : 0;
      const quizMark = assessment ? assessment.quiz_mark : 0;

      // Map exams: Midterm and Final

const midtermExam = student.studentExams.find(
  (se) =>
    se.exam.course_id === result.course_id &&
    se.exam.semester_id === result.semester_id &&
    se.exam.exam_type === ExamType.MIDTERM
);

      const midtermMark = midtermExam ? midtermExam.marks : 0;
const finalExam = student.studentExams.find(
  (se) =>
    se.exam.course_id === result.course_id &&
    se.exam.semester_id === result.semester_id &&
    se.exam.exam_type === ExamType.FINAL
);

      const finalMark = finalExam ? finalExam.marks : 0;

      semesterMap.get(semesterId)!.courses.push({
        course_name: result.course.course_name,
        course_code: result.course.course_code,
        credit_hours: result.course.credit_hours,
        attendance_mark: attendanceMark,
        assignment_mark: assignmentMark,
        quiz_mark: quizMark,
        midterm_mark: midtermMark,
        final_mark: finalMark,
        total_marks: result.total_marks,
        grade: result.grade,
        gpa: result.gpa,
      });
    }

    // 5. Calculate Semester GPA and Semester Credit Hours
    const semestersWithCalculations = Array.from(semesterMap.entries()).map(
      ([semesterId, data]) => {
        let totalCreditHours = 0;
        let sumGpaCredits = 0;

        for (const course of data.courses) {
          totalCreditHours += course.credit_hours;
          sumGpaCredits += course.gpa * course.credit_hours;
        }

        const semesterGpa =
          totalCreditHours > 0
            ? Number((sumGpaCredits / totalCreditHours).toFixed(2))
            : 0;

        return {
          semester_id: semesterId,
          semester_name: data.semester_name,
          courses: data.courses,
          total_credit_hours: totalCreditHours,
          semester_gpa: semesterGpa,
        };
      }
    );

    // Sort semesters by semester_id ascending to keep it chronological
    semestersWithCalculations.sort((a, b) => a.semester_id - b.semester_id);

    // 6. Calculate Overall CGPA and Overall Credit Hours
    let overallTotalCreditHours = 0;
    let overallSumGpaCredits = 0;

    for (const sem of semestersWithCalculations) {
      overallTotalCreditHours += sem.total_credit_hours;
      for (const course of sem.courses) {
        overallSumGpaCredits += course.gpa * course.credit_hours;
      }
    }

    const cgpa =
      overallTotalCreditHours > 0
        ? Number((overallSumGpaCredits / overallTotalCreditHours).toFixed(2))
        : 0;

    // Final transcript data
   const semestersResponse = semestersWithCalculations;

    // 7. Construct final JSON response
    return NextResponse.json({
      success: true,
      student: {
        student_id: student.student_id,
        full_name: student.full_name,
        roll_no: student.roll_no,
        email: student.email,
        faculty: student.faculty.faculty_name,
        department: student.department.department_name,
        academic_year: student.academic.year,
      },
      semesters: semestersResponse,
      summary: {
         total_semesters: semestersResponse.length,
    total_courses: student.results.length,
    total_credit_hours: overallTotalCreditHours,
    cgpa: cgpa,
      },
    });
  } catch (error) {
    console.error("Error generating transcript:", error);
    return prismaErrorResponse(error, "Failed to generate transcript");
  }
}
