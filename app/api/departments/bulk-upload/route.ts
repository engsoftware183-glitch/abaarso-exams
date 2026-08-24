import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { DEPARTMENT_IMPORT_FIELDS, mapHeaders, missingRequiredHeaders } from "@/lib/import/import-config";

// ======================================================
// BULK UPLOAD DEPARTMENTS (real CSV/XLSX import)
// ======================================================
//
// Accepts parsed rows ({ headers, rows }) from the import UI and
// validates every row against the real database:
//   - required fields: department_name, faculty
//   - faculty resolved by name to real faculty_id - unknown values
//     mark the row INVALID, never auto-created
//   - duplicate department_name against the DB and within the batch
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

    const missing = missingRequiredHeaders(headers, DEPARTMENT_IMPORT_FIELDS);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required columns: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const fieldIndex = mapHeaders(headers, DEPARTMENT_IMPORT_FIELDS);

    function valueAt(row: string[], key: string): string {
      const index = fieldIndex.get(key);
      if (index === undefined) return "";
      return String(row[index] ?? "").trim();
    }

    // =========================================
    // LOAD REFERENCE DATA (faculty name -> id)
    // =========================================

    const faculties = await prisma.faculty.findMany({
      select: { faculty_id: true, faculty_name: true },
    });
    const facultyByName = new Map(faculties.map((f) => [f.faculty_name.trim().toLowerCase(), f.faculty_id]));

    // =========================================
    // LOAD EXISTING DEPARTMENT NAMES (duplicate detection)
    // =========================================

    const departmentNames = [...new Set(dataRows.map((row) => valueAt(row, "department_name")).filter(Boolean))];
    const existingDepartments = await prisma.department.findMany({
      where: { department_name: { in: departmentNames } },
      select: { department_name: true },
    });
    const existingNameSet = new Set(existingDepartments.map((d) => d.department_name.toLowerCase()));

    // =========================================
    // ROW VALIDATION
    // =========================================

    const results: ImportRowResult[] = [];
    const validRows: { department_name: string; faculty_id: number }[] = [];

    const seenNames = new Set<string>();

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 for header, +1 for 1-based
      const reasons: string[] = [];

      const departmentName = valueAt(row, "department_name");
      const facultyValue = valueAt(row, "faculty");

      // required fields
      if (!departmentName) reasons.push("missing required field: department_name");
      if (!facultyValue) reasons.push("missing required field: faculty");

      // faculty relationship resolution
      const facultyId = facultyValue ? facultyByName.get(facultyValue.toLowerCase()) : undefined;
      if (facultyValue && facultyId === undefined) {
        reasons.push(`unknown faculty: ${facultyValue}`);
      }

      // duplicates (case-insensitive, only checked when the value is otherwise present)
      const nameKey = departmentName.toLowerCase();
      if (departmentName && (existingNameSet.has(nameKey) || seenNames.has(nameKey))) {
        reasons.push(existingNameSet.has(nameKey) ? "department name already exists" : "duplicate department name in file");
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
      validRows.push({
        department_name: departmentName,
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
      const created = await prisma.department.createMany({ data: validRows });
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
      console.log("BULK_UPLOAD_DEPARTMENTS_SAVE_ERROR", error);
      return prismaErrorResponse(error, "Failed to import departments");
    }
  } catch (error) {
    console.log("BULK_UPLOAD_DEPARTMENTS_ERROR", error);
    return prismaErrorResponse(error, "Failed to upload departments");
  }
}
