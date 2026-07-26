import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// GET ALL STUDENTS
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
    // GET STUDENTS
    // =========================================

    const students =
      await prisma.student.findMany({


include: {
  academic: true,
  faculty: true,
  department: true,
  semester: true,

  studentExams: {
    include: {
      exam: {
        select: {
          exam_id: true,
          exam_type: true,
          total_marks: true,
          exam_date: true,
        },
      },
    },
  },
},
        orderBy: {
          created_at: "desc",
        },

      });

    return NextResponse.json(
      {
        success: true,

        count: students.length,

        students,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_STUDENTS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch students");
  }
}


// ======================================================
// CREATE STUDENT
// ======================================================

export async function POST(
  req: NextRequest
) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // REQUEST BODY
    // =========================================

    const body =
      await req.json();

    const {
      user_id,
      full_name,
      roll_no,
      gender,
      email,
      phone,
      address,
      academic_id,
      faculty_id,
      department_id,
      semester_id,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !user_id ||
      !full_name ||
      !roll_no ||
      !gender ||
      !email ||
      !academic_id ||
      !faculty_id ||
      !department_id ||
      !semester_id
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "All required fields are required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // CHECK EMAIL
    // =========================================

    const existingEmail = await prisma.student.findFirst({
      // Use Prisma.StudentWhereInput for correct typing of the where clause.
      where: ({
        email,
      } as Prisma.StudentWhereInput),
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Email already exists",
        },
        {
          status: 409,
        }
      );
    }

    // =========================================
    // CHECK ROLL NUMBER
    // =========================================

    const existingRoll =
      await prisma.student.findFirst({

        where: {
          roll_no,
        },

      });

    if (existingRoll) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Roll number already exists",
        },
        {
          status: 409,
        }
      );
    }

    // =========================================
    // CREATE STUDENT
    // =========================================

    const student =
      await prisma.student.create({

        data: {
          user_id:
            Number(user_id),

          full_name,

          roll_no,

          gender,

          email,

          phone,

          address,

          academic_id:
            Number(academic_id),

          faculty_id:
            Number(faculty_id),

          department_id:
            Number(department_id),

          semester_id:
            Number(semester_id),
        },

       include: {
  academic: true,
  faculty: true,
  department: true,
  semester: true,

  studentExams: {
    include: {
      exam: {
        select: {
          exam_id: true,
          exam_type: true,
          total_marks: true,
          exam_date: true,
        },
      },
    },
  },
},

      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Student created successfully",

        student,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "CREATE_STUDENT_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to create student");
  }
}
