import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { STUDENT_EXAM_IMPORT_FIELDS, mapHeaders, missingRequiredHeaders } from "@/lib/import/import-config";
import { logActivity } from "@/lib/activity-log";

// ======================================================
// BULK UPLOAD STUDENT EXAM MARKS (real CSV/XLSX import)
// ======================================================
//
// Accepts parsed rows ({ headers, rows }) from the import UI and
// validates every row against the real database:
//   - required fields: student, exam_id, marks
//   - student resolved by roll_no to real student_id - unknown values
//     mark the row INVALID, never auto-created
//   - exam_id must reference a real exam - unknown values mark the
//     row INVALID
//   - marks must be a valid number, non-negative, and not exceed the
//     exam's total_marks
//   - duplicate student + exam against the DB and within the batch
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

    const missing = missingRequiredHeaders(headers, STUDENT_EXAM_IMPORT_FIELDS);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required columns: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const fieldIndex = mapHeaders(headers, STUDENT_EXAM_IMPORT_FIELDS);

    function valueAt(row: string[], key: string): string {
      const index = fieldIndex.get(key);
      if (index === undefined) return "";
      return String(row[index] ?? "").trim();
    }

    // =========================================
    // LOAD REFERENCE DATA (roll_no -> student_id, exam_id -> exam)
    // =========================================

    const [students, exams] = await Promise.all([
      prisma.student.findMany({ select: { student_id: true, roll_no: true } }),
      prisma.exam.findMany({ select: { exam_id: true, total_marks: true } }),
    ]);

    const studentByRollNo = new Map(students.map((s) => [s.roll_no.trim().toLowerCase(), s.student_id]));
    const examById = new Map(exams.map((e) => [e.exam_id, e.total_marks]));

    // =========================================
    // LOAD EXISTING STUDENT EXAMS (duplicate detection)
    // =========================================

    const existingStudentExams = await prisma.studentExam.findMany({
      select: { student_id: true, exam_id: true },
    });
    const existingStudentExamSet = new Set(
      existingStudentExams.map((se) => `${se.student_id}|${se.exam_id}`)
    );

    // =========================================
    // ROW VALIDATION
    // =========================================

    const results: ImportRowResult[] = [];
    const validRows: { student_id: number; exam_id: number; marks: number }[] = [];

    const seenStudentExams = new Set<string>();

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 for header, +1 for 1-based
      const reasons: string[] = [];

      const studentValue = valueAt(row, "student");
      const examIdValue = valueAt(row, "exam_id");
      const marksValue = valueAt(row, "marks");

      // required fields
      if (!studentValue) reasons.push("missing required field: student");
      if (!examIdValue) reasons.push("missing required field: exam_id");
      if (!marksValue) reasons.push("missing required field: marks");

      // student relationship resolution
      const studentId = studentValue ? studentByRollNo.get(studentValue.toLowerCase()) : undefined;
      if (studentValue && studentId === undefined) {
        reasons.push(`unknown student: ${studentValue}`);
      }

      // exam_id validation
      const examId = Number(examIdValue);
      const examTotalMarks = examIdValue ? examById.get(examId) : undefined;
      if (examIdValue && (Number.isNaN(examId) || examTotalMarks === undefined)) {
        reasons.push(`unknown exam: ${examIdValue}`);
      }

      // marks validation
      const marks = Number(marksValue);
      if (marksValue && Number.isNaN(marks)) {
        reasons.push("invalid marks (must be a number)");
      }
      if (!Number.isNaN(marks) && marks < 0) {
        reasons.push("marks cannot be negative");
      }
      if (!Number.isNaN(marks) && examTotalMarks !== undefined && marks > examTotalMarks) {
        reasons.push(`marks cannot exceed exam total_marks (${examTotalMarks})`);
      }

      // duplicates (only checked when relationships resolved)
      if (studentId !== undefined && examIdValue && examTotalMarks !== undefined) {
        const studentExamKey = `${studentId}|${examId}`;
        if (existingStudentExamSet.has(studentExamKey) || seenStudentExams.has(studentExamKey)) {
          reasons.push(
            existingStudentExamSet.has(studentExamKey)
              ? "student exam mark already exists"
              : "duplicate student exam in file"
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
      const studentExamKey = `${studentId}|${examId}`;
      seenStudentExams.add(studentExamKey);

      results.push({ rowNumber, status: "VALID", reasons: [] });
      validRows.push({
        student_id: studentId as number,
        exam_id: examId,
        marks: marks,
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
      const created = await prisma.studentExam.createMany({ data: validRows });

      void logActivity("BULK_IMPORT_STUDENT_EXAMS", `Imported ${created.count} student exam marks, ${summary.skipped} skipped, ${summary.invalid} failed`);

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
      console.log("BULK_UPLOAD_STUDENT_EXAMS_SAVE_ERROR", error);
      return prismaErrorResponse(error, "Failed to import student exam marks");
    }
  } catch (error) {
    console.log("BULK_UPLOAD_STUDENT_EXAMS_ERROR", error);
    return prismaErrorResponse(error, "Failed to upload student exam marks");
  }
}
