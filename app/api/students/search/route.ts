import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// SEARCH STUDENTS
// ======================================================

export async function GET(
  req: NextRequest
) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = await requireStudentScope(req);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // SEARCH PARAM
    // =========================================

    const search =
      req.nextUrl.searchParams.get("search");

    // =========================================
    // SEARCH STUDENTS
    // =========================================

    const students =
      await prisma.student.findMany({

        // A STUDENT's search is always restricted to their own record.
        where: ({
          ...(auth.student
            ? { student_id: auth.student.student_id }
            : {}),

          OR: [

            {
              full_name: {
                contains:
                  search || "",
                mode: "insensitive",
              },
            },

            {
              roll_no: {
                contains:
                  search || "",
                mode: "insensitive",
              },
            },

            {
              email: {
                contains:
                  search || "",
                mode: "insensitive",
              },
            },

          ],
        } as Prisma.StudentWhereInput),

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

        count: students.length,

        students,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "SEARCH_STUDENTS_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to search students");
  }
}