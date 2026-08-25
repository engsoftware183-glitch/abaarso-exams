import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { ResultStatus } from "@prisma/client";
import { requireStudentScope } from "@/lib/student-scope";
import { prismaErrorResponse } from "@/lib/errors";
import {
  buildCsvString,
  buildXlsxBuffer,
  buildExportFilename,
  EXPORT_MAX_ROWS,
} from "@/lib/export-utils";
import { logActivity } from "@/lib/activity-log";

// ======================================================
// RESULTS EXPORT
// ======================================================
//
// Authorised by the same requireStudentScope guard as the
// pagination route. Students are forced to PUBLISHED results
// for their own student_id at the database level — never via
// a client-supplied query parameter.
//
// Grades/GPA are NOT recalculated here; the stored values are
// the source of truth.
//
// Max rows: EXPORT_MAX_ROWS (5 000).

const CSV_HEADERS = [
  "Student Name",
  "Roll Number",
  "Course Code",
  "Course Name",
  "Semester",
  "Total Marks",
  "Grade",
  "GPA",
  "Remarks",
  "Status",
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
    const semesterId = searchParams.get("semester_id")?.trim();
    const courseId = searchParams.get("course_id")?.trim();
    const statusParam = searchParams.get("status")?.trim();

    // SECURITY: for STUDENT callers the status is always forced to
    // PUBLISHED at the database level regardless of any query parameter.
    const requestedStatus =
      statusParam === "PUBLISHED"
        ? ResultStatus.PUBLISHED
        : statusParam === "DRAFT"
        ? ResultStatus.DRAFT
        : undefined;

    const statusFilter: ResultStatus | undefined = auth.student
      ? ResultStatus.PUBLISHED
      : requestedStatus;

    const where: Prisma.ResultWhereInput = {
      // Students may only see their own results.
      ...(auth.student
        ? { student_id: auth.student.student_id }
        : {}),

      ...(search
        ? {
            OR: [
              { student: { full_name: { contains: search, mode: "insensitive" } } },
              { student: { roll_no: { contains: search, mode: "insensitive" } } },
              { course: { course_name: { contains: search, mode: "insensitive" } } },
              { course: { course_code: { contains: search, mode: "insensitive" } } },
              { grade: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),

      ...(semesterId ? { semester_id: Number(semesterId) } : {}),
      ...(courseId ? { course_id: Number(courseId) } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    // =========================================
    // FETCH (capped at EXPORT_MAX_ROWS)
    // =========================================

    const results = await prisma.result.findMany({
      where,
      take: EXPORT_MAX_ROWS,
      orderBy: { result_id: "desc" },
      include: {
        student: {
          select: {
            full_name: true,
            roll_no: true,
          },
        },
        course: {
          select: {
            course_name: true,
            course_code: true,
          },
        },
        semester: {
          select: {
            semester_name: true,
          },
        },
      },
    });

    // =========================================
    // MAP TO ROWS (no recalculation — stored values only)
    // =========================================

    const rows = results.map((r) => [
      r.student?.full_name ?? "",
      r.student?.roll_no ?? "",
      r.course?.course_code ?? "",
      r.course?.course_name ?? "",
      r.semester?.semester_name ?? "",
      r.total_marks,
      r.grade,
      r.gpa,
      r.remarks ?? "",
      r.status,
    ] as (string | number | null | undefined)[]);

    const filename = buildExportFilename("results", format);
    const truncated = results.length >= EXPORT_MAX_ROWS;

    void logActivity("EXPORT_RESULTS", `Exported ${results.length} result records as ${format.toUpperCase()}`);

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
          "X-Export-Count": String(results.length),
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
        "X-Export-Count": String(results.length),
        "X-Export-Truncated": String(truncated),
      },
    });
  } catch (error) {
    console.error("RESULTS_EXPORT_ERROR", error);
    return prismaErrorResponse(error, "Failed to export results");
  }
}
