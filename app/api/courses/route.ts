import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";

// ======================================================
// GET ALL COURSES
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
    // GET COURSES
    // =========================================

    // A STUDENT only ever sees the courses of their own department -
    // the same relationship used to scope exams and transcripts.
    const courses =
      await prisma.course.findMany({

        where: auth.student
          ? { department_id: auth.student.department_id }
          : undefined,

        include: {
          department: true,
          semester: true,
        },

        orderBy: {
          created_at: "desc",
        },

      });

    return NextResponse.json(
      {
        success: true,

        count: courses.length,

        courses,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_COURSES_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch courses");
  }
}


// ======================================================
// CREATE COURSE
// ======================================================

export async function POST(req: NextRequest) {
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
      course_name,
      course_code,
      credit_hours,
      description,
      department_id,
      semester_id,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !course_name ||
      !course_code ||
      credit_hours === undefined ||
      !department_id ||
      !semester_id
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "All fields are required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // CHECK EXISTING COURSE
    // =========================================

    const existingCourse =
      await prisma.course.findUnique({
        where: {
          course_code,
        },
      });

    if (existingCourse) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Course already exists",
        },
        {
          status: 409,
        }
      );
    }

    // =========================================
    // CHECK DEPARTMENT
    // =========================================

    const department =
      await prisma.department.findUnique({
        where: {
          department_id:
            Number(department_id),
        },
      });

    if (!department) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Department not found",
        },
        {
          status: 404,
        }
      );
    }

    // =========================================
    // CHECK SEMESTER
    // =========================================

    const semester =
      await prisma.semester.findUnique({
        where: {
          semester_id:
            Number(semester_id),
        },
      });

    if (!semester) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Semester not found",
        },
        {
          status: 404,
        }
      );
    }

    // =========================================
    // CREATE COURSE
    // =========================================

    const course =
      await prisma.course.create({

        data: {
          course_name,

          course_code,

          credit_hours:
            Number(credit_hours),

          description,

          department_id:
            Number(department_id),

          semester_id:
            Number(semester_id),
        },

        include: {
          department: true,
          semester: true,
        },

      });

    void logActivity("CREATE_COURSE", `Created course ${course_name} (${course_code})`);

    return NextResponse.json(
      {
        success: true,

        message:
          "Course created successfully",

        course,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "CREATE_COURSE_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to create course");
  }
}
