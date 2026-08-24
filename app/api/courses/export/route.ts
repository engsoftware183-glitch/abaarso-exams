import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";
import {
  buildCsvString,
  buildXlsxBuffer,
  buildExportFilename,
  EXPORT_MAX_ROWS,
} from "@/lib/export-utils";

// ======================================================
// COURSES EXPORT
// ======================================================
//
// Authorised by the same requireStudentScope guard as the
// pagination route. Students are scoped to their own department.
//
// Max rows: EXPORT_MAX_ROWS (5 000).

const CSV_HEADERS = [
  "Course Code",
  "Course Name",
  "Credit Hours",
  "Description",
  "Department",
  "Semester",
];

const XLSX_HEADERS = CSV_HEADERS;

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
    // FORMAT PARAM
    // =========================================

    const searchParams = req.nextUrl.searchParams;
    const formatParam = searchParams.get("format")?.toLowerCase();
    const format: "csv" | "xlsx" =
      formatParam === "xlsx" ? "xlsx" : "csv";

    // =========================================
    // WHERE CLAUSE (mirrors pagination route)
    // =========================================

    const search = searchParams.get("search")?.trim();
    const departmentId = searchParams.get("department_id")?.trim();
    const semesterId = searchParams.get("semester_id")?.trim();

    const where: Prisma.CourseWhereInput = {
      // Students may only ever see their own department's courses.
      ...(auth.student
        ? { department_id: auth.student.department_id }
        : {}),
      ...(search
        ? {
            OR: [
              { course_code: { contains: search, mode: "insensitive" } },
              { course_name: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(departmentId ? { department_id: Number(departmentId) } : {}),
      ...(semesterId ? { semester_id: Number(semesterId) } : {}),
    };

    // =========================================
    // FETCH (capped at EXPORT_MAX_ROWS)
    // =========================================

    const courses = await prisma.course.findMany({
      where,
      take: EXPORT_MAX_ROWS,
      include: {
        department: { select: { department_name: true } },
        semester: { select: { semester_name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    // =========================================
    // MAP TO ROWS
    // =========================================

    const rows = courses.map((c) => [
      c.course_code,
      c.course_name,
      c.credit_hours,
      c.description ?? "",
      c.department?.department_name ?? "",
      c.semester?.semester_name ?? "",
    ] as (string | number | null | undefined)[]);

    const filename = buildExportFilename("courses", format);
    const truncated = courses.length >= EXPORT_MAX_ROWS;

    // =========================================
    // RESPOND
    // =========================================

    if (format === "xlsx") {
      const buf = buildXlsxBuffer(XLSX_HEADERS, rows);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Export-Count": String(courses.length),
          "X-Export-Truncated": String(truncated),
        },
      });
    }

    const csv = buildCsvString(CSV_HEADERS, rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Count": String(courses.length),
        "X-Export-Truncated": String(truncated),
      },
    });
  } catch (error) {
    console.error("COURSES_EXPORT_ERROR", error);
    return prismaErrorResponse(error, "Failed to export courses");
  }
}
