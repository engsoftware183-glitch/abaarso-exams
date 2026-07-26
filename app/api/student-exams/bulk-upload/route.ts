import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// BULK UPLOAD STUDENT EXAMS
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
    // GET BODY
    // =========================================

    const body =
      await req.json();

    const {
      studentExams,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !studentExams ||
      !Array.isArray(studentExams)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "studentExams array is required",
        },
        {
          status: 400,
        }
      );
    }

// =========================================
// VALIDATE EACH ITEM
// =========================================

for (const item of studentExams) {
  if (!item.student_id || !item.exam_id) {
    return NextResponse.json(
      {
        success: false,
        message: "student_id and exam_id are required",
      },
      {
        status: 400,
      }
    );
  }

  if (Number(item.marks) < 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Marks cannot be negative",
      },
      {
        status: 400,
      }
    );
  }
}

    // =========================================
    // CREATE MANY
    // =========================================

    const result =
      await prisma.studentExam.createMany({

        data: studentExams.map(
          (
            item: {
              student_id: number;
              exam_id: number;
              marks: number;
            }
          ) => ({
            student_id:
              Number(item.student_id),

            exam_id:
              Number(item.exam_id),

            marks:
              Number(item.marks),
          })
        ),

        skipDuplicates: true,
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Student exams uploaded successfully",

        count:
          result.count,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "BULK_UPLOAD_STUDENT_EXAMS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to upload student exams");
  }
}
