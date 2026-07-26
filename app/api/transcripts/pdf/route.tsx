import { ResultStatus, ExamType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import TranscriptTemplate from "@/pdf/transcript.template";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("student_id");

    if (!studentIdParam) {
      return NextResponse.json(
        { error: "Invalid student ID" },
        { status: 400 }
      );
    }

    const studentId = parseInt(studentIdParam, 10);
    if (isNaN(studentId) || studentId <= 0) {
      return NextResponse.json(
        { error: "Invalid student ID" },
        { status: 400 }
      );
    }

    // 1. Fetch student details and relation records in an optimized query
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

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Define TypeScript structures for courses and semesters
    interface CourseData {
      course_code: string;
      course_name: string;
      credit_hours: number;
      attendance_mark: number;
      assignment_mark: number;
      quiz_mark: number;
      midterm_mark: number;
      final_mark: number;
      total_marks: number;
      grade: string;
      gpa: number;
    }

    interface SemesterData {
      semester_id?: number;
      semester_name: string;
      courses: CourseData[];
      total_credit_hours: number;
      semester_gpa: number;
    }

    const semesterMap = new Map<
      number,
      {
        semester_name: string;
        courses: CourseData[];
      }
    >();

    // 2. Map results, attendance, assessments, and exams per course
    for (const result of student.results) {
      const semesterId = result.semester_id;
      const semesterName = result.semester.semester_name;

      if (!semesterMap.has(semesterId)) {
        semesterMap.set(semesterId, {
          semester_name: semesterName,
          courses: [],
        });
      }

      // Find attendance mark
      const attendance = student.attendances.find(
        (a) => a.course_id === result.course_id
      );
      const attendanceMark = attendance ? attendance.attendance_mark : 0;

      // Find assessment marks
      const assessment = student.assessments.find(
        (a) => a.course_id === result.course_id
      );
      const assignmentMark = assessment ? assessment.assignment_mark : 0;
      const quizMark = assessment ? assessment.quiz_mark : 0;

      // Find midterm exam marks using course_id, semester_id, and exam_type
      const midtermExam = student.studentExams.find(
        (se) =>
          se.exam.course_id === result.course_id &&
          se.exam.semester_id === result.semester_id &&
          se.exam.exam_type === ExamType.MIDTERM
      );
      const midtermMark = midtermExam ? midtermExam.marks : 0;

      // Find final exam marks using course_id, semester_id, and exam_type
      const finalExam = student.studentExams.find(
        (se) =>
          se.exam.course_id === result.course_id &&
          se.exam.semester_id === result.semester_id &&
          se.exam.exam_type === ExamType.FINAL
      );
      const finalMark = finalExam ? finalExam.marks : 0;

      semesterMap.get(semesterId)!.courses.push({
        course_code: result.course.course_code,
        course_name: result.course.course_name,
        credit_hours: result.course.credit_hours,
        attendance_mark: attendanceMark,
        assignment_mark: assignmentMark,
        quiz_mark: quizMark,
        midterm_mark: midtermMark,
        final_mark: finalMark,
        total_marks: result.total_marks,
        grade: result.grade || "F",
        gpa: result.gpa || 0,
      });
    }

    // 3. Compute GPA per semester
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

    // Sort chronologically by semester ID
    semestersWithCalculations.sort((a, b) => a.semester_id - b.semester_id);

    // 4. Compute overall academic summary details
    let overallTotalCreditHours = 0;
    let overallSumGpaCredits = 0;
    let totalCourses = 0;

    for (const sem of semestersWithCalculations) {
      overallTotalCreditHours += sem.total_credit_hours;
      totalCourses += sem.courses.length;
      for (const course of sem.courses) {
        overallSumGpaCredits += course.gpa * course.credit_hours;
      }
    }

    const cgpa =
      overallTotalCreditHours > 0
        ? Number((overallSumGpaCredits / overallTotalCreditHours).toFixed(2))
        : 0;

    // Use semestersWithCalculations directly, keeping semester_id available
    const semestersResponse: SemesterData[] = semestersWithCalculations;

    // Determine academic standing & final result dynamically based on CGPA
    let academicStanding: string | undefined = undefined;
    let finalResult: string | undefined = undefined;

    if (cgpa >= 3.8) academicStanding = "First Class Honours";
    else if (cgpa >= 3.5) academicStanding = "Second Class Upper";
    else if (cgpa >= 3.0) academicStanding = "Second Class Lower";
    else if (cgpa >= 2.0) academicStanding = "Pass";
    else if (cgpa > 0) academicStanding = "Academic Probation";

    if (cgpa >= 2.0) finalResult = "PASS / GRADUATED";
    else if (cgpa > 0) finalResult = "FAIL / RETENTION REQUIRED";

    // Build the complete student response object matching the template's interfaces
    const studentResponse = {
      student_id: student.student_id,
      full_name: student.full_name,
      roll_no: student.roll_no,
      email: student.email,
      faculty: student.faculty?.faculty_name || "Faculty of Engineering",
      department: student.department?.department_name || "",
      academic_year: student.academic?.year || "",
      programme: (student as { programme?: string | null }).programme ?? "N/A",
      batch: (student as { batch?: string | null }).batch ?? "N/A",
      admission_date: (student as { admission_date?: string | null }).admission_date ?? "N/A",
      current_status: (student as { current_status?: string | null }).current_status ?? "ACTIVE",
      transcript_date: (student as { transcript_date?: string | null }).transcript_date ?? new Date().toISOString().split("T")[0],
    };

    const summaryResponse = {
      total_semesters: semestersResponse.length,
      total_courses: totalCourses,
      total_credit_hours: overallTotalCreditHours,
      cgpa: cgpa,
      academicStanding,
      finalResult,
    };

    // 5. Load University Logo from public folder as Base64 Data URL
    const logoPath = path.join(process.cwd(), "public", "image.png");
    let logoBase64 = "";
    try {
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      } else {
        console.warn("University logo not found at public/image.png");
      }
    } catch (logoError) {
      console.error("Error reading logo file:", logoError);
    }

    // 6. Generate Verification QR Code using environment base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify/transcript/${studentId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 2,
      width: 150,
    });

    // 7. Generate PDF Stream/Buffer using JSX
    const pdfBuffer = await renderToBuffer(
      <TranscriptTemplate
        student={studentResponse}
        semesters={semestersResponse}
        summary={summaryResponse}
        logo={logoBase64}
        qrCode={qrCodeDataUrl}
      />
    );

    // 8. Build Response with custom filename format
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="Transcript_${student.roll_no}_${student.student_id}.pdf"`
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error generating transcript PDF:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
