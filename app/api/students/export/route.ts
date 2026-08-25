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
import { logActivity } from "@/lib/activity-log";

// ======================================================
// STUDENTS EXPORT
// ======================================================
//
// Authorised by the same requireStudentScope guard as the
// pagination route. Students may only export their own record.
// Admins export all records matching the supplied filters.
//
// Sensitive fields excluded: user_id, password, any JWT/auth data.
// Max rows: EXPORT_MAX_ROWS (5 000).

const CSV_HEADERS = [
  "Roll Number",
  "Full Name",
  "Gender",
  "Email",
  "Phone",
  "Address",
  "Academic Year",
  "Faculty",
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
    const academicId = searchParams.get("academic_id")?.trim();
    const facultyId = searchParams.get("faculty_id")?.trim();
    const departmentId = searchParams.get("department_id")?.trim();
    const semesterId = searchParams.get("semester_id")?.trim();

    const where: Prisma.StudentWhereInput = {
      // Students may only ever see their own record.
      ...(auth.student ? { student_id: auth.student.student_id } : {}),
      ...(search
        ? {
            OR: [
              { full_name: { contains: search, mode: "insensitive" } },
              { roll_no: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(academicId ? { academic_id: Number(academicId) } : {}),
      ...(facultyId ? { faculty_id: Number(facultyId) } : {}),
      ...(departmentId ? { department_id: Number(departmentId) } : {}),
      ...(semesterId ? { semester_id: Number(semesterId) } : {}),
    };

    // =========================================
    // FETCH (capped at EXPORT_MAX_ROWS)
    // =========================================

    const students = await prisma.student.findMany({
      where,
      take: EXPORT_MAX_ROWS,
      include: {
        academic: { select: { year: true } },
        faculty: { select: { faculty_name: true } },
        department: { select: { department_name: true } },
        semester: { select: { semester_name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    // =========================================
    // MAP TO ROWS  (no password / auth fields)
    // =========================================

    const rows = students.map((s) => [
      s.roll_no,
      s.full_name,
      s.gender,
      s.email,
      s.phone ?? "",
      s.address ?? "",
      s.academic?.year ?? "",
      s.faculty?.faculty_name ?? "",
      s.department?.department_name ?? "",
      s.semester?.semester_name ?? "",
    ] as (string | number | null | undefined)[]);

    const filename = buildExportFilename("students", format);
    const truncated = students.length >= EXPORT_MAX_ROWS;

    void logActivity("EXPORT_STUDENTS", `Exported ${students.length} student records as ${format.toUpperCase()}`);

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
          "X-Export-Count": String(students.length),
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
        "X-Export-Count": String(students.length),
        "X-Export-Truncated": String(truncated),
      },
    });
  } catch (error) {
    console.error("STUDENTS_EXPORT_ERROR", error);
    return prismaErrorResponse(error, "Failed to export students");
  }
}
