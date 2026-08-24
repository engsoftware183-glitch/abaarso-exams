import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { FACULTY_IMPORT_FIELDS, mapHeaders, missingRequiredHeaders } from "@/lib/import/import-config";

// ======================================================
// BULK UPLOAD FACULTIES (real CSV/XLSX import)
// ======================================================
//
// Accepts parsed rows ({ headers, rows }) from the import UI and
// validates every row against the real database:
//   - required field: faculty_name
//   - duplicate faculty_name against the DB and within the batch
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

    const missing = missingRequiredHeaders(headers, FACULTY_IMPORT_FIELDS);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required columns: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const fieldIndex = mapHeaders(headers, FACULTY_IMPORT_FIELDS);

    function valueAt(row: string[], key: string): string {
      const index = fieldIndex.get(key);
      if (index === undefined) return "";
      return String(row[index] ?? "").trim();
    }

    // =========================================
    // LOAD EXISTING FACULTY NAMES (duplicate detection)
    // =========================================

    const facultyNames = [...new Set(dataRows.map((row) => valueAt(row, "faculty_name")).filter(Boolean))];
    const existingFaculties = await prisma.faculty.findMany({
      where: { faculty_name: { in: facultyNames } },
      select: { faculty_name: true },
    });
    const existingNameSet = new Set(existingFaculties.map((f) => f.faculty_name.toLowerCase()));

    // =========================================
    // ROW VALIDATION
    // =========================================

    const results: ImportRowResult[] = [];
    const validRows: { faculty_name: string }[] = [];

    const seenNames = new Set<string>();

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 for header, +1 for 1-based
      const reasons: string[] = [];

      const facultyName = valueAt(row, "faculty_name");

      // required field
      if (!facultyName) reasons.push("missing required field: faculty_name");

      // duplicates (case-insensitive)
      const nameKey = facultyName.toLowerCase();
      if (facultyName && (existingNameSet.has(nameKey) || seenNames.has(nameKey))) {
        reasons.push(existingNameSet.has(nameKey) ? "faculty name already exists" : "duplicate faculty name in file");
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
      seenNames.add(nameKey);

      results.push({ rowNumber, status: "VALID", reasons: [] });
      validRows.push({ faculty_name: facultyName });
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
      const created = await prisma.faculty.createMany({ data: validRows });
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
      console.log("BULK_UPLOAD_FACULTIES_SAVE_ERROR", error);
      return prismaErrorResponse(error, "Failed to import faculties");
    }
  } catch (error) {
    console.log("BULK_UPLOAD_FACULTIES_ERROR", error);
    return prismaErrorResponse(error, "Failed to upload faculties");
  }
}
