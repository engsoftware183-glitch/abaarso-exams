import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// GET SINGLE STUDENT
// ======================================================

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    const params =
      await context.params;

    // =========================================
    // GET STUDENT
    // =========================================

    const student =
      await prisma.student.findUnique({

        where: {
          student_id:
            Number(params.id),
        },

        include: {

  academic: true,

  faculty: true,

  department: true,

  attendances: {
    include: {
      course: true,
    },
  },

  assessments: {
    include: {
      course: true,
    },
  },

  results: true,

},

});




    // =========================================
    // CHECK STUDENT
    // =========================================

    if (!student) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Student not found",
        },
        {
          status: 404,
        }
      );
    }

    // =========================================
    // GET SEMESTER + FILTERED COURSES
    // =========================================

    const semester =
      await prisma.semester.findUnique({

        where: {
          semester_id:
            student.semester_id,
        },

        include: {

          courses: {

            where: {
              department_id:
                student.department_id,
            },

            orderBy: {
              created_at: "desc",
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

        student: {
          ...student,

          semester,
        },
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_SINGLE_STUDENT_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch student");
  }
}


// ======================================================
// UPDATE STUDENT
// ======================================================

export async function PUT(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    const params =
      await context.params;

    // =========================================
    // REQUEST BODY
    // =========================================

    const body =
      await req.json();

    const {
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
    // CHECK EMAIL
    // =========================================

    const existingEmail =
      await prisma.student.findFirst({

        where: ({
          email,

          NOT: {
            student_id:
              Number(params.id),
          },

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
    // UPDATE STUDENT
    // =========================================

    const student =
      await prisma.student.update({

        where: {
          student_id:
            Number(params.id),
        },

        data: {
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
        },

      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Student updated successfully",

        student,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "UPDATE_STUDENT_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to update student");
  }
}


// ======================================================
// DELETE STUDENT
// ======================================================

export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    const params =
      await context.params;

    // =========================================
    // DELETE STUDENT
    // =========================================

    await prisma.student.delete({

      where: {
        student_id:
          Number(params.id),
      },

    });

    return NextResponse.json(
      {
        success: true,

        message:
          "Student deleted successfully",
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "DELETE_STUDENT_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to delete student");
  }
}
