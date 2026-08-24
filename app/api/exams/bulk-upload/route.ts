import { NextRequest, NextResponse } from "next/server";
import { ExamType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { EXAM_IMPORT_FIELDS, mapHeaders, missingRequiredHeaders } from "@/lib/import/import-config";

// ======================================================
// BULK UPLOAD EXAMS (real CSV/XLSX import)
// ======================================================
//
// Accepts parsed rows ({ headers, rows }) from the import UI and
// validates every row against the real database:
//   - required fields: exam_type, total_marks, exam_date, academic,
//     faculty, semester, course
//   - exam_type must be MIDTERM or FINAL
//   - academic resolved by year to real academic_id - unknown values
//     mark the row INVALID, never auto-created
//   - faculty resolved by name to real faculty_id - unknown values
//     mark the row INVALID, never auto-created
//   - semester resolved by name to real semester_id - unknown values
//     mark the row INVALID, never auto-created
//   - course resolved by code to real course_id - unknown values
//     mark the row INVALID, never auto-created
//   - duplicate exam (same exam_type + course + academic + faculty +
//     semester) against the DB and within the batch is marked SKIPPED
//
// dryRun: true validates and reports WITHOUT writing. The save path
// inserts all VALID rows atomically.

type ImportRowResult = {
  rowNumber: number;
  status: "VALID" | "INVALID" | "SKIPPED";
  reasons: string[];
};

const VALID_EXAM_TYPES: string[] = ["MIDTERM", "FINAL"];

function normalizeExamType(value: string): ExamType | null {
  const upper = value.trim().toUpperCase();
  return VALID_EXAM_TYPES.includes(upper) ? (upper as ExamType) : null;
}

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

    const missing = missingRequiredHeaders(headers, EXAM_IMPORT_FIELDS);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required columns: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const fieldIndex = mapHeaders(headers, EXAM_IMPORT_FIELDS);

    function valueAt(row: string[], key: string): string {
      const index = fieldIndex.get(key);
      if (index === undefined) return "";
      return String(row[index] ?? "").trim();
    }

    // =========================================
    // LOAD REFERENCE DATA (name -> id)
    // =========================================

    const [academics, faculties, semesters, courses] = await Promise.all([
      prisma.academic.findMany({ select: { academic_id: true, year: true } }),
      prisma.faculty.findMany({ select: { faculty_id: true, faculty_name: true } }),
      prisma.semester.findMany({ select: { semester_id: true, semester_name: true } }),
      prisma.course.findMany({ select: { course_id: true, course_code: true } }),
    ]);

    const academicByYear = new Map(academics.map((a) => [a.year.trim(), a.academic_id]));
    const facultyByName = new Map(faculties.map((f) => [f.faculty_name.trim().toLowerCase(), f.faculty_id]));
    const semesterByName = new Map(semesters.map((s) => [s.semester_name.trim().toLowerCase(), s.semester_id]));
    const courseByCode = new Map(courses.map((c) => [c.course_code.trim().toLowerCase(), c.course_id]));

    // =========================================
    // LOAD EXISTING EXAMS (duplicate detection)
    // =========================================

    const existingExams = await prisma.exam.findMany({
      select: { exam_type: true, academic_id: true, faculty_id: true, semester_id: true, course_id: true },
    });
    const existingExamSet = new Set(
      existingExams.map((e) => `${e.exam_type}|${e.academic_id}|${e.faculty_id}|${e.semester_id}|${e.course_id}`)
    );

    // =========================================
    // ROW VALIDATION
    // =========================================

    const results: ImportRowResult[] = [];
    const validRows: { exam_type: ExamType; total_marks: number; exam_date: Date; academic_id: number; faculty_id: number; semester_id: number; course_id: number }[] = [];

    const seenExams = new Set<string>();

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 for header, +1 for 1-based
      const reasons: string[] = [];

      const examTypeValue = valueAt(row, "exam_type");
      const totalMarksValue = valueAt(row, "total_marks");
      const examDateValue = valueAt(row, "exam_date");
      const academicValue = valueAt(row, "academic");
      const facultyValue = valueAt(row, "faculty");
      const semesterValue = valueAt(row, "semester");
      const courseValue = valueAt(row, "course");

      // required fields
      if (!examTypeValue) reasons.push("missing required field: exam_type");
      if (!totalMarksValue) reasons.push("missing required field: total_marks");
      if (!examDateValue) reasons.push("missing required field: exam_date");
      if (!academicValue) reasons.push("missing required field: academic");
      if (!facultyValue) reasons.push("missing required field: faculty");
      if (!semesterValue) reasons.push("missing required field: semester");
      if (!courseValue) reasons.push("missing required field: course");

      // exam_type validation
      const examType = normalizeExamType(examTypeValue);
      if (examTypeValue && !examType) {
        reasons.push("invalid exam_type (must be MIDTERM or FINAL)");
      }

      // total_marks validation
      const totalMarks = Number(totalMarksValue);
      if (totalMarksValue && (Number.isNaN(totalMarks) || totalMarks <= 0)) {
        reasons.push("invalid total_marks (must be a positive number)");
      }

      // exam_date validation
      const examDate = new Date(examDateValue);
      if (examDateValue && Number.isNaN(examDate.getTime())) {
        reasons.push("invalid exam_date (must be a valid date)");
      }

      // relationship resolution
      const academicId = academicValue ? academicByYear.get(academicValue) : undefined;
      const facultyId = facultyValue ? facultyByName.get(facultyValue.toLowerCase()) : undefined;
      const semesterId = semesterValue ? semesterByName.get(semesterValue.toLowerCase()) : undefined;
      const courseId = courseValue ? courseByCode.get(courseValue.toLowerCase()) : undefined;

      if (academicValue && academicId === undefined) {
        reasons.push(`unknown academic year: ${academicValue}`);
      }
      if (facultyValue && facultyId === undefined) {
        reasons.push(`unknown faculty: ${facultyValue}`);
      }
      if (semesterValue && semesterId === undefined) {
        reasons.push(`unknown semester: ${semesterValue}`);
      }
      if (courseValue && courseId === undefined) {
        reasons.push(`unknown course: ${courseValue}`);
      }

      // duplicates (only checked when relationships resolved)
      if (examType && academicId !== undefined && facultyId !== undefined && semesterId !== undefined && courseId !== undefined) {
        const examKey = `${examType}|${academicId}|${facultyId}|${semesterId}|${courseId}`;
        if (existingExamSet.has(examKey) || seenExams.has(examKey)) {
          reasons.push(
            existingExamSet.has(examKey)
              ? "exam already exists for this type, course, academic, faculty, and semester"
              : "duplicate exam in file"
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
      const examKey = `${examType}|${academicId}|${facultyId}|${semesterId}|${courseId}`;
      seenExams.add(examKey);

      results.push({ rowNumber, status: "VALID", reasons: [] });
      validRows.push({
        exam_type: examType as ExamType,
        total_marks: totalMarks,
        exam_date: examDate,
        academic_id: academicId as number,
        faculty_id: facultyId as number,
        semester_id: semesterId as number,
        course_id: courseId as number,
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
      const created = await prisma.exam.createMany({ data: validRows });
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
      console.log("BULK_UPLOAD_EXAMS_SAVE_ERROR", error);
      return prismaErrorResponse(error, "Failed to import exams");
    }
  } catch (error) {
    console.log("BULK_UPLOAD_EXAMS_ERROR", error);
    return prismaErrorResponse(error, "Failed to upload exams");
  }
}
