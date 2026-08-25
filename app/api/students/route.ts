import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";


// ======================================================
// GET ALL STUDENTS
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
    // GET STUDENTS
    // =========================================

    const students =
      await prisma.student.findMany({

        // A STUDENT may only ever list their own record - the query
        // itself is scoped so no other student's PII can leak.
        where: auth.student
          ? { student_id: auth.student.student_id }
          : undefined,

        include: {
          academic: true,
          faculty: true,
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
//
// A Student row must belong to a User (schema: student.user_id unique,
// onDelete: Cascade). Two flows are supported:
//
//   1. user_id provided  -> link an existing User account
//   2. username + password provided -> create a STUDENT User account
//      and the Student profile in a single transaction, so a failed
//      profile insert never leaves an orphan account behind.

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
      user_id,
      username,
      password,
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
          message: "All required fields are required",
        },
        {
          status: 400,
        }
      );
    }

    // Account resolution: link an existing user OR create a STUDENT
    // account alongside the profile. Refuse when neither is provided.
    if (!user_id && (!username || !password)) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required to create a student account",
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
      where: ({

        email,

      } as Prisma.StudentWhereInput),
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists",
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
          message: "Roll number already exists",
        },
        {
          status: 409,
        }
      );
    }

    // =========================================
    // CHECK USER ACCOUNT (username/password flow)
    // =========================================

    if (!user_id) {
      const existingUser =
        await prisma.user.findFirst({
          where: {
            OR: [{ username }, { email }],
          },
        });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "Username or email is already registered",
          },
          {
            status: 409,
          }
        );
      }
    }

    // =========================================
    // CREATE STUDENT (+ STUDENT ACCOUNT)
    // =========================================

    const student =
      await prisma.$transaction(
        async (tx) => {

          let finalUserId =
            user_id
              ? Number(user_id)
              : null;

          if (!finalUserId) {

            const user =
              await tx.user.create({
                data: {
                  username,
                  email,
                  password:
                    await bcrypt.hash(
                      password,
                      10
                    ),
                  role: "STUDENT",
                },
              });

            finalUserId =
              user.user_id;
          }

          return tx.student.create({
            data: {
              user_id: finalUserId,
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
        }
      );

    void logActivity("CREATE_STUDENT", `Created student ${full_name} (roll: ${roll_no})`);

    return NextResponse.json(
      {
        success: true,
        message: "Student created successfully",
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
