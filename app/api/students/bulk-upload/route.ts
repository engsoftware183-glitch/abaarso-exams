import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  verifyToken,
} from "@/lib/auth";

import {
  Gender,
} from "@prisma/client";


// ======================================================
// BULK UPLOAD STUDENTS
// ======================================================

export async function POST(
  req: NextRequest
) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const authHeader =
      req.headers.get(
        "authorization"
      );

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid token",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================
    // ONLY ADMINS
    // =========================================

    if (
      decoded.role !==
        "SUPER_ADMIN" &&
      decoded.role !==
        "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Access denied",
        },
        {
          status: 403,
        }
      );
    }

    // =========================================
    // GET REQUEST BODY
    // =========================================

    const body =
      await req.json();

    const { students } =
      body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !students ||
      !Array.isArray(
        students
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Students array is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // FORMAT STUDENTS
    // =========================================

    const formattedStudents:
    {
      user_id: number;
      full_name: string;
      roll_no: string;
      gender: Gender;
      email: string;
      phone: string | null;
      address: string | null;
      academic_id: number;
      faculty_id: number;
      department_id: number;
      semester_id: number;
    }[] =

      students.map(
        (
          student: {
            user_id:
              string | number;

            full_name:
              string;

            roll_no:
              string;

            gender:
              Gender;

            email:
              string;

            phone?:
              string |
              number |
              null;

            address?:
              string |
              number |
              null;

            academic_id:
              string | number;

            faculty_id:
              string | number;

            department_id:
              string | number;

            semester_id:
              string | number;
          }
        ) => ({

          user_id:
            Number(
              student.user_id
            ),

          full_name:
            String(
              student.full_name
            ),

          roll_no:
            String(
              student.roll_no
            ),

          gender:
            student.gender,

          email:
            String(
              student.email
            ),

          phone:
            student.phone
              ? String(
                  student.phone
                )
              : null,

          address:
            student.address
              ? String(
                  student.address
                )
              : null,

          academic_id:
            Number(
              student.academic_id
            ),

          faculty_id:
            Number(
              student.faculty_id
            ),

          department_id:
            Number(
              student.department_id
            ),

          semester_id:
            Number(
              student.semester_id
            ),
        })
      );

    // =========================================
    // CREATE MANY STUDENTS
    // =========================================

    const createdStudents =
      await prisma.student.createMany({

        data:
          formattedStudents,

        skipDuplicates: true,
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Students uploaded successfully",

        count:
          createdStudents.count,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "BULK_UPLOAD_STUDENTS_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to upload students",
      },
      {
        status: 500,
      }
    );
  }
}