import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { SEMESTER_IMPORT_FIELDS, mapHeaders, missingRequiredHeaders } from "@/lib/import/import-config";
import { logActivity } from "@/lib/activity-log";

// ======================================================
// BULK UPLOAD SEMESTERS (real CSV/XLSX import)
// ======================================================
//
// Accepts parsed rows ({ headers, rows }) from the import UI and
// validates every row against the real database:
//   - required fields: semester_name, academic, faculty
//   - academic resolved by year to real academic_id - unknown values
//     mark the row INVALID, never auto-created
//   - faculty resolved by name to real faculty_id - unknown values
//     mark the row INVALID, never auto-created
//   - duplicate semester (same semester_name + academic + faculty)
//     against the DB and within the batch is marked SKIPPED
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

    const missing = missingRequiredHeaders(headers, SEMESTER_IMPORT_FIELDS);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required columns: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const fieldIndex = mapHeaders(headers, SEMESTER_IMPORT_FIELDS);

    function valueAt(row: string[], key: string): string {
      const index = fieldIndex.get(key);
      if (index === undefined) return "";
      return String(row[index] ?? "").trim();
    }

    // =========================================
    // LOAD REFERENCE DATA (name -> id)
    // =========================================

    const [academics, faculties] = await Promise.all([
      prisma.academic.findMany({ select: { academic_id: true, year: true } }),
      prisma.faculty.findMany({ select: { faculty_id: true, faculty_name: true } }),
    ]);

    const academicByYear = new Map(academics.map((a) => [a.year.trim(), a.academic_id]));
    const facultyByName = new Map(faculties.map((f) => [f.faculty_name.trim().toLowerCase(), f.faculty_id]));

    // =========================================
    // LOAD EXISTING SEMESTERS (duplicate detection)
    // =========================================

    const existingSemesters = await prisma.semester.findMany({
      select: { semester_name: true, academic_id: true, faculty_id: true },
    });
    const existingSemesterSet = new Set(
      existingSemesters.map((s) => `${s.semester_name.toLowerCase()}|${s.academic_id}|${s.faculty_id}`)
    );

    // =========================================
    // ROW VALIDATION
    // =========================================

    const results: ImportRowResult[] = [];
    const validRows: { semester_name: string; academic_id: number; faculty_id: number }[] = [];

    const seenSemesters = new Set<string>();

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 for header, +1 for 1-based
      const reasons: string[] = [];

      const semesterName = valueAt(row, "semester_name");
      const academicValue = valueAt(row, "academic");
      const facultyValue = valueAt(row, "faculty");

      // required fields
      if (!semesterName) reasons.push("missing required field: semester_name");
      if (!academicValue) reasons.push("missing required field: academic");
      if (!facultyValue) reasons.push("missing required field: faculty");

      // relationship resolution
      const academicId = academicValue ? academicByYear.get(academicValue) : undefined;
      const facultyId = facultyValue ? facultyByName.get(facultyValue.toLowerCase()) : undefined;

      if (academicValue && academicId === undefined) {
        reasons.push(`unknown academic year: ${academicValue}`);
      }
      if (facultyValue && facultyId === undefined) {
        reasons.push(`unknown faculty: ${facultyValue}`);
      }

      // duplicates (only checked when relationships resolved)
      if (semesterName && academicId !== undefined && facultyId !== undefined) {
        const semesterKey = `${semesterName.toLowerCase()}|${academicId}|${facultyId}`;
        if (existingSemesterSet.has(semesterKey) || seenSemesters.has(semesterKey)) {
          reasons.push(
            existingSemesterSet.has(semesterKey)
              ? "semester already exists for this academic year and faculty"
              : "duplicate semester in file"
          );
        }
      }

      // classification: duplicates are SKIPPED, other problems INVALID
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

      // VALID
      const semesterKey = `${semesterName.toLowerCase()}|${academicId}|${facultyId}`;
      seenSemesters.add(semesterKey);

      results.push({ rowNumber, status: "VALID", reasons: [] });
      validRows.push({
        semester_name: semesterName,
        academic_id: academicId as number,
        faculty_id: facultyId as number,
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
      const created = await prisma.semester.createMany({ data: validRows });

      void logActivity("BULK_IMPORT_SEMESTERS", `Imported ${created.count} semesters, ${summary.skipped} skipped, ${summary.invalid} failed`);

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
      console.log("BULK_UPLOAD_SEMESTERS_SAVE_ERROR", error);
      return prismaErrorResponse(error, "Failed to import semesters");
    }
  } catch (error) {
    console.log("BULK_UPLOAD_SEMESTERS_ERROR", error);
    return prismaErrorResponse(error, "Failed to upload semesters");
  }
}
