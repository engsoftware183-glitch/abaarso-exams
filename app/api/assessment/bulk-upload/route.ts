import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { ASSESSMENT_IMPORT_FIELDS, mapHeaders, missingRequiredHeaders } from "@/lib/import/import-config";
import { logActivity } from "@/lib/activity-log";

// ======================================================
// BULK UPLOAD ASSESSMENTS (real CSV/XLSX import)
// ======================================================
//
// Accepts parsed rows ({ headers, rows }) from the import UI and
// validates every row against the real database:
//   - required fields: student, course, assignment_mark, quiz_mark
//   - student resolved by roll_no to real student_id - unknown values
//     mark the row INVALID, never auto-created
//   - course resolved by course_code to real course_id - unknown values
//     mark the row INVALID, never auto-created
//   - total_assessment is derived as assignment_mark + quiz_mark
//     (preserving existing backend logic)
//   - duplicate assessment (same student + course) against the DB and
//     within the batch is marked SKIPPED
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

    const missing = missingRequiredHeaders(headers, ASSESSMENT_IMPORT_FIELDS);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required columns: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const fieldIndex = mapHeaders(headers, ASSESSMENT_IMPORT_FIELDS);

    function valueAt(row: string[], key: string): string {
      const index = fieldIndex.get(key);
      if (index === undefined) return "";
      return String(row[index] ?? "").trim();
    }

    // =========================================
    // LOAD REFERENCE DATA (roll_no -> student_id, course_code -> course_id)
    // =========================================

    const [students, courses] = await Promise.all([
      prisma.student.findMany({ select: { student_id: true, roll_no: true } }),
      prisma.course.findMany({ select: { course_id: true, course_code: true } }),
    ]);

    const studentByRollNo = new Map(students.map((s) => [s.roll_no.trim().toLowerCase(), s.student_id]));
    const courseByCode = new Map(courses.map((c) => [c.course_code.trim().toLowerCase(), c.course_id]));

    // =========================================
    // LOAD EXISTING ASSESSMENTS (duplicate detection)
    // =========================================

    const existingAssessments = await prisma.assessment.findMany({
      select: { student_id: true, course_id: true },
    });
    const existingAssessmentSet = new Set(
      existingAssessments.map((a) => `${a.student_id}|${a.course_id}`)
    );

    // =========================================
    // ROW VALIDATION
    // =========================================

    const results: ImportRowResult[] = [];
    const validRows: { assignment_mark: number; quiz_mark: number; total_assessment: number; student_id: number; course_id: number }[] = [];

    const seenAssessments = new Set<string>();

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 for header, +1 for 1-based
      const reasons: string[] = [];

      const studentValue = valueAt(row, "student");
      const courseValue = valueAt(row, "course");
      const assignmentMarkValue = valueAt(row, "assignment_mark");
      const quizMarkValue = valueAt(row, "quiz_mark");

      // required fields
      if (!studentValue) reasons.push("missing required field: student");
      if (!courseValue) reasons.push("missing required field: course");
      if (!assignmentMarkValue) reasons.push("missing required field: assignment_mark");
      if (!quizMarkValue) reasons.push("missing required field: quiz_mark");

      // student relationship resolution
      const studentId = studentValue ? studentByRollNo.get(studentValue.toLowerCase()) : undefined;
      if (studentValue && studentId === undefined) {
        reasons.push(`unknown student: ${studentValue}`);
      }

      // course relationship resolution
      const courseId = courseValue ? courseByCode.get(courseValue.toLowerCase()) : undefined;
      if (courseValue && courseId === undefined) {
        reasons.push(`unknown course: ${courseValue}`);
      }

      // numeric validation
      const assignmentMark = Number(assignmentMarkValue);
      const quizMark = Number(quizMarkValue);
      if (assignmentMarkValue && Number.isNaN(assignmentMark)) {
        reasons.push("invalid assignment_mark (must be a number)");
      }
      if (quizMarkValue && Number.isNaN(quizMark)) {
        reasons.push("invalid quiz_mark (must be a number)");
      }

      // duplicates (only checked when relationships resolved)
      if (studentId !== undefined && courseId !== undefined) {
        const assessmentKey = `${studentId}|${courseId}`;
        if (existingAssessmentSet.has(assessmentKey) || seenAssessments.has(assessmentKey)) {
          reasons.push(
            existingAssessmentSet.has(assessmentKey)
              ? "assessment already exists for this student and course"
              : "duplicate assessment in file"
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
      const assessmentKey = `${studentId}|${courseId}`;
      seenAssessments.add(assessmentKey);

      // Preserve existing backend logic: total_assessment = assignment_mark + quiz_mark
      const totalAssessment = assignmentMark + quizMark;

      results.push({ rowNumber, status: "VALID", reasons: [] });
      validRows.push({
        assignment_mark: assignmentMark,
        quiz_mark: quizMark,
        total_assessment: totalAssessment,
        student_id: studentId as number,
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
      const created = await prisma.assessment.createMany({ data: validRows });

      void logActivity("BULK_IMPORT_ASSESSMENTS", `Imported ${created.count} assessments, ${summary.skipped} skipped, ${summary.invalid} failed`);

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
      console.log("BULK_UPLOAD_ASSESSMENTS_SAVE_ERROR", error);
      return prismaErrorResponse(error, "Failed to import assessments");
    }
  } catch (error) {
    console.log("BULK_UPLOAD_ASSESSMENTS_ERROR", error);
    return prismaErrorResponse(error, "Failed to upload assessments");
  }
}
