export {};

// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { ResultStatus , ExamType } from "@prisma/client";

// // ======================================================
// // GET ALL RESULTS
// // ======================================================

// export async function GET() {
//   try {
//     const results = await prisma.result.findMany({
//       include: {
//         student: {
//           select: {
//             student_id: true,
//             full_name: true,
//             roll_no: true,
//           },
//         },
//         course: {
//           select: {
//             course_id: true,
//             course_name: true,
//             course_code: true,
//           },
//         },
//         semester: {
//           select: {
//             semester_id: true,
//             semester_name: true,
//           },
//         },
//       },
//       orderBy: {
//         result_id: "desc",
//       },
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         count: results.length,
//         results,
//       },
//       {
//         status: 200,
//       }
//     );
//   } catch (error) {
//     console.log("GET_RESULTS_ERROR", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Internal Server Error",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }

// // ======================================================
// // CREATE RESULT
// // ======================================================

// function calculateGrade(totalMarks: number): string {
//   if (totalMarks >= 90) return "A";
//   if (totalMarks >= 80) return "A-";
//   if (totalMarks >= 70) return "B+";
//   if (totalMarks >= 60) return "B";
//   if (totalMarks >= 50) return "C";
//   if (totalMarks >= 40) return "D";
//   return "F";
// }

// function calculateGPA(grade: string): number {
//   switch (grade) {
//     case "A":
//       return 4.0;
//     case "A-":
//       return 3.7;
//     case "B+":
//       return 3.5;
//     case "B":
//       return 3.0;
//     case "C":
//       return 2.0;
//     case "D":
//       return 1.0;
//     case "F":
//       return 0.0;
//     default:
//       return 0.0;
//   }
// }

// function getRemarks(grade: string): string {
//   switch (grade) {
//     case "A":
//       return "Outstanding";
//     case "A-":
//       return "Excellent";
//     case "B+":
//       return "Very Good";
//     case "B":
//       return "Good";
//     case "C":
//       return "Pass";
//     case "D":
//       return "Weak";
//     case "F":
//       return "Fail";
//     default:
//       return "";
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();

//     const { student_id, course_id, semester_id, status } = body;

//     // =========================================
//     // VALIDATION
//     // =========================================

//     if (!student_id || !course_id || !semester_id) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Student, Course and Semester are required",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     // =========================================
//     // CHECK DUPLICATE
//     // =========================================

//     const existingResult = await prisma.result.findUnique({
//       where: {
//         student_id_course_id_semester_id: {
//           student_id: Number(student_id),
//           course_id: Number(course_id),
//           semester_id: Number(semester_id),
//         },
//       },
//     });

//     if (existingResult) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Result already exists",
//         },
//         {
//           status: 409,
//         }
//       );
//     }

//     // =========================================
//     // VERIFY STUDENT EXISTS
//     // =========================================

//     const student = await prisma.student.findUnique({
//       where: {
//         student_id: Number(student_id),
//       },
//     });

//     if (!student) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Student not found",
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     // =========================================
//     // VERIFY COURSE EXISTS
//     // =========================================

//     const course = await prisma.course.findUnique({
//       where: {
//         course_id: Number(course_id),
//       },
//     });

//     if (!course) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Course not found",
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     // =========================================
//     // VERIFY SEMESTER EXISTS
//     // =========================================

//     const semester = await prisma.semester.findUnique({
//       where: {
//         semester_id: Number(semester_id),
//       },
//     });

//     if (!semester) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Semester not found",
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     // =========================================
//     // AUTOMATIC CALCULATIONS WITH TRANSACTION
//     // =========================================

//     const result = await prisma.$transaction(async (tx) => {
//       // Fetch Attendance
//       const attendance = await tx.attendance.findFirst({
//         where: {
//           student_id: Number(student_id),
//           course_id: Number(course_id),
//         },
//         select: {
//           attendance_mark: true,
//         },
//       });

//       const attendanceMark = attendance?.attendance_mark ?? 0;

//       // Fetch Assessment
//       const assessment = await tx.assessment.findFirst({
//         where: {
//           student_id: Number(student_id),
//           course_id: Number(course_id),
//         },
//         select: {
//           assignment_mark: true,
//           quiz_mark: true,
//         },
//       });

//       const assignmentMark = assessment?.assignment_mark ?? 0;
//       const quizMark = assessment?.quiz_mark ?? 0;

//       // Fetch StudentExam records with Exam details
     

//       const studentExams = await tx.studentExam.findMany({
//   where: {
//     student_id: Number(student_id),
//     exam: {
//       course_id: Number(course_id),
//       semester_id: Number(semester_id),
//     },
//   },
//         include: {
//           exam: {
//             select: {
//               exam_type: true,
//             },
//           },
//         },
//       });

//       let midtermMark = 0;
//       let finalMark = 0;

//       for (const studentExam of studentExams) {
//          if (studentExam.exam.exam_type === ExamType.MIDTERM)   {
//           midtermMark = studentExam.marks;
//         } else if (studentExam.exam.exam_type === ExamType.FINAL) {
//           finalMark = studentExam.marks;
//         }
//       }

//       // Calculate Total Marks
//       const totalMarks =
//         attendanceMark +
//         assignmentMark +
//         quizMark +
//         midtermMark +
//         finalMark;

//       // Calculate Grade, GPA, Remarks
//       const grade = calculateGrade(totalMarks);
//       const gpa = calculateGPA(grade);
//       const remarks = getRemarks(grade);

//       // Create Result
//       const newResult = await tx.result.create({
//         data: {
//           student_id: Number(student_id),
//           course_id: Number(course_id),
//           semester_id: Number(semester_id),
        
//           total_marks: totalMarks,
//           grade,
//           gpa,
//           remarks,
//           status: (status as ResultStatus) || ResultStatus.DRAFT,
//         },
//         include: {
//           student: true,
//           course: true,
//           semester: true,
        
//         },
//       });

//       return newResult;
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Result created successfully",
//         result,
//       },
//       {
//         status: 201,
//       }
//     );
//   } catch (error) {
//     console.log("CREATE_RESULT_ERROR", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Internal Server Error",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }