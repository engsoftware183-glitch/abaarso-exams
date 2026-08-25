import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { COURSE_IMPORT_FIELDS, mapHeaders, missingRequiredHeaders } from "@/lib/import/import-config";
import { logActivity } from "@/lib/activity-log";

// ======================================================
// BULK UPLOAD COURSES (real CSV/XLSX import)
// ======================================================
//
// Accepts parsed rows ({ headers, rows }) from the import UI and
// validates every row against the real database:
//   - required fields, numeric credit hours
//   - department/semester resolved by name to real IDs - unknown
//     values mark the row INVALID, never auto-created
//   - duplicate course_code against the DB and within the batch
//     is marked SKIPPED
//
// dryRun: true validates and reports WITHOUT writing. The save path
// inserts all VALID rows atomically.

type ImportRowResult = {
  rowNumber: number;
  status: "VALID" | "INVALID" | "SKIPPED";
  reasons: string[];
};

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

    const body = await req.json();
    const { headers, rows, dryRun } = body as {
      headers?: string[];
      rows?: string[][];
      dryRun?: boolean;
    };

    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return NextResponse.json(
        { success: false, message: "Parsed headers and rows are required" },
        { status: 400 }
      );
    }

    const dataRows = rows.filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""));

    if (dataRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "The file contains no data rows" },
        { status: 400 }
      );
    }

    if (dataRows.length > 500) {
      return NextResponse.json(
        { success: false, message: "The file exceeds the maximum of 500 rows" },
        { status: 400 }
      );
    }

    // =========================================
    // HEADER VALIDATION
    // =========================================

    const missing = missingRequiredHeaders(headers, COURSE_IMPORT_FIELDS);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required columns: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const fieldIndex = mapHeaders(headers, COURSE_IMPORT_FIELDS);

    function valueAt(row: string[], key: string): string {
      const index = fieldIndex.get(key);
      if (index === undefined) return "";
      return String(row[index] ?? "").trim();
    }

    // =========================================
    // LOAD REFERENCE DATA (name -> id)
    // =========================================

    const [departments, semesters] = await Promise.all([
      prisma.department.findMany({ select: { department_id: true, department_name: true } }),
      prisma.semester.findMany({ select: { semester_id: true, semester_name: true } }),
    ]);

    const departmentByName = new Map(departments.map((d) => [d.department_name.trim().toLowerCase(), d.department_id]));
    const semesterByName = new Map(semesters.map((s) => [s.semester_name.trim().toLowerCase(), s.semester_id]));

    // =========================================
    // LOAD EXISTING COURSE CODES (duplicate detection)
    // =========================================

    const courseCodes = [...new Set(dataRows.map((row) => valueAt(row, "course_code")).filter(Boolean))];
    const existingCourses = await prisma.course.findMany({
      where: { course_code: { in: courseCodes } },
      select: { course_code: true },
    });
    const existingCodeSet = new Set(existingCourses.map((c) => c.course_code));

    // =========================================
    // ROW VALIDATION
    // =========================================

    const results: ImportRowResult[] = [];
    const validRows: {
      course_name: string;
      course_code: string;
      credit_hours: number;
      description: string | null;
      department_id: number;
      semester_id: number;
    }[] = [];

    const seenCodes = new Set<string>();

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2;
      const reasons: string[] = [];

      const courseName = valueAt(row, "course_name");
      const courseCode = valueAt(row, "course_code");
      const creditHoursValue = valueAt(row, "credit_hours");
      const description = valueAt(row, "description");
      const departmentValue = valueAt(row, "department");
      const semesterValue = valueAt(row, "semester");

      // required fields
      if (!courseName) reasons.push("missing required field: course_name");
      if (!courseCode) reasons.push("missing required field: course_code");
      if (!creditHoursValue) reasons.push("missing required field: credit_hours");
      if (!departmentValue) reasons.push("missing required field: department");
      if (!semesterValue) reasons.push("missing required field: semester");

      // numeric credit hours (positive integer)
      const creditHours = Number(creditHoursValue);
      if (creditHoursValue && (!Number.isInteger(creditHours) || creditHours <= 0)) {
        reasons.push("invalid credit_hours (must be a positive whole number)");
      }

      // relationship resolution
      const departmentId = departmentValue ? departmentByName.get(departmentValue.toLowerCase()) : undefined;
      const semesterId = semesterValue ? semesterByName.get(semesterValue.toLowerCase()) : undefined;

      if (departmentValue && departmentId === undefined) reasons.push(`unknown department: ${departmentValue}`);
      if (semesterValue && semesterId === undefined) reasons.push(`unknown semester: ${semesterValue}`);

      // duplicates
      if (courseCode && (existingCodeSet.has(courseCode) || seenCodes.has(courseCode))) {
        reasons.push(existingCodeSet.has(courseCode) ? "course code already exists" : "duplicate course code in file");
      }

      const hasDuplicate = reasons.some(
        (reason) => reason.includes("already exists") || reason.includes("duplicate")
      );
      const hasError = reasons.length > 0 && !hasDuplicate;

      if (hasError) {
        results.push({ rowNumber, status: "INVALID", reasons });
        return;
      }

      if (hasDuplicate) {
        results.push({ rowNumber, status: "SKIPPED", reasons });
        return;
      }

      seenCodes.add(courseCode);

      results.push({ rowNumber, status: "VALID", reasons: [] });
      validRows.push({
        course_name: courseName,
        course_code: courseCode,
        credit_hours: creditHours,
        description: description || null,
        department_id: departmentId as number,
        semester_id: semesterId as number,
      });
    });

    const summary = {
      totalRows: dataRows.length,
      valid: validRows.length,
      invalid: results.filter((r) => r.status === "INVALID").length,
      skipped: results.filter((r) => r.status === "SKIPPED").length,
    };

    // =========================================
    // DRY RUN (preview only - no writes)
    // =========================================

    if (dryRun) {
      return NextResponse.json(
        { success: true, dryRun: true, summary, results, imported: 0, failed: summary.invalid, skipped: summary.skipped },
        { status: 200 }
      );
    }

    if (validRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid rows to import", summary, results, imported: 0, failed: summary.invalid, skipped: summary.skipped },
        { status: 400 }
      );
    }

    // =========================================
    // SAVE (atomic createMany)
    // =========================================

    try {
      const created = await prisma.course.createMany({ data: validRows });

      void logActivity("BULK_IMPORT_COURSES", `Imported ${created.count} courses, ${summary.skipped} skipped, ${summary.invalid} failed`);

      return NextResponse.json(
        {
          success: true,
          dryRun: false,
          summary,
          results: results.filter((r) => r.status !== "VALID"),
          imported: created.count,
          failed: summary.invalid,
          skipped: summary.skipped,
        },
        { status: 201 }
      );
    } catch (error) {
      console.log("BULK_UPLOAD_COURSES_SAVE_ERROR", error);
      return prismaErrorResponse(error, "Failed to import courses");
    }
  } catch (error) {
    console.log("BULK_UPLOAD_COURSES_ERROR", error);
    return prismaErrorResponse(error, "Failed to upload courses");
  }
}
