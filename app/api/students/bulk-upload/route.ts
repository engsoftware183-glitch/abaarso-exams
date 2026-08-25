import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { Gender } from "@prisma/client";
import { mapHeaders, missingRequiredHeaders, STUDENT_IMPORT_FIELDS } from "@/lib/import/import-config";
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy";
import { logActivity } from "@/lib/activity-log";

// ======================================================
// BULK UPLOAD STUDENTS (real CSV/XLSX import)
// ======================================================
//
// Accepts parsed rows ({ headers, rows }) from the import UI and
// validates every row against the real database:
//   - required fields, gender enum, email format
//   - relationship values (academic/faculty/department/semester)
//     resolved by name to real IDs - unknown values mark the row
//     INVALID, never auto-created
//   - duplicates (roll_no, email, username) against the DB and
//     within the batch are marked SKIPPED
//
// dryRun: true validates and reports WITHOUT writing. The save path
// creates a User + Student account per VALID row inside a single
// transaction, so a failure never leaves partial records.

type ImportRowResult = {
  rowNumber: number;
  status: "VALID" | "INVALID" | "SKIPPED";
  reasons: string[];
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeGender(value: string): Gender | null {
  const upper = value.trim().toUpperCase();
  return upper === "MALE" || upper === "FEMALE" ? (upper as Gender) : null;
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

    if (dataRows.length > 200) {
      return NextResponse.json(
        { success: false, message: "The file exceeds the maximum of 200 rows" },
        { status: 400 }
      );
    }

    // =========================================
    // HEADER VALIDATION
    // =========================================

    const missing = missingRequiredHeaders(headers, STUDENT_IMPORT_FIELDS);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required columns: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const fieldIndex = mapHeaders(headers, STUDENT_IMPORT_FIELDS);

    function valueAt(row: string[], key: string): string {
      const index = fieldIndex.get(key);
      if (index === undefined) return "";
      return String(row[index] ?? "").trim();
    }

    // =========================================
    // LOAD REFERENCE DATA (name -> id)
    // =========================================

    const [academics, faculties, departments, semesters] = await Promise.all([
      prisma.academic.findMany({ select: { academic_id: true, year: true } }),
      prisma.faculty.findMany({ select: { faculty_id: true, faculty_name: true } }),
      prisma.department.findMany({ select: { department_id: true, department_name: true } }),
      prisma.semester.findMany({ select: { semester_id: true, semester_name: true } }),
    ]);

    const academicByYear = new Map(academics.map((a) => [a.year.trim(), a.academic_id]));
    const facultyByName = new Map(faculties.map((f) => [f.faculty_name.trim().toLowerCase(), f.faculty_id]));
    const departmentByName = new Map(departments.map((d) => [d.department_name.trim().toLowerCase(), d.department_id]));
    const semesterByName = new Map(semesters.map((s) => [s.semester_name.trim().toLowerCase(), s.semester_id]));

    // =========================================
    // LOAD EXISTING UNIQUE VALUES (duplicate detection)
    // =========================================

    const rollNos = [...new Set(dataRows.map((row) => valueAt(row, "roll_no")).filter(Boolean))];
    const emails = [...new Set(dataRows.map((row) => valueAt(row, "email")).filter(Boolean))];
    const usernames = [...new Set(dataRows.map((row) => valueAt(row, "username")).filter(Boolean))];

    const [existingRolls, existingStudentEmails, existingUsers] = await Promise.all([
      prisma.student.findMany({ where: { roll_no: { in: rollNos } }, select: { roll_no: true } }),
      prisma.student.findMany({ where: { email: { in: emails } }, select: { email: true } }),
      prisma.user.findMany({
        where: { OR: [{ username: { in: usernames } }, { email: { in: emails } }] },
        select: { username: true, email: true },
      }),
    ]);

    const existingRollSet = new Set(existingRolls.map((s) => s.roll_no));
    const existingStudentEmailSet = new Set(existingStudentEmails.map((s) => s.email));
    const existingUsernameSet = new Set(existingUsers.map((u) => u.username));
    const existingUserEmailSet = new Set(existingUsers.map((u) => u.email));

    // =========================================
    // ROW VALIDATION
    // =========================================

    const results: ImportRowResult[] = [];
    const validRows: {
      username: string;
      password: string;
      full_name: string;
      roll_no: string;
      gender: Gender;
      email: string;
      phone: string | null;
      address: string | null;
      academic_id: number;
      faculty_id: number;
      department_id: number;
      semester_id: number;
    }[] = [];

    const seenRoll = new Set<string>();
    const seenEmail = new Set<string>();
    const seenUsername = new Set<string>();

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 for header, +1 for 1-based
      const reasons: string[] = [];

      const username = valueAt(row, "username");
      const password = valueAt(row, "password");
      const fullName = valueAt(row, "full_name");
      const rollNo = valueAt(row, "roll_no");
      const genderValue = valueAt(row, "gender");
      const email = valueAt(row, "email");
      const phone = valueAt(row, "phone");
      const address = valueAt(row, "address");
      const academicValue = valueAt(row, "academic");
      const facultyValue = valueAt(row, "faculty");
      const departmentValue = valueAt(row, "department");
      const semesterValue = valueAt(row, "semester");

      // required fields
      if (!username) reasons.push("missing required field: username");
      if (!password) reasons.push("missing required field: password");
      else if (!isPasswordValid(password)) reasons.push(PASSWORD_POLICY_MESSAGE);
      if (!fullName) reasons.push("missing required field: full_name");
      if (!rollNo) reasons.push("missing required field: roll_no");
      if (!genderValue) reasons.push("missing required field: gender");
      if (!email) reasons.push("missing required field: email");
      if (!academicValue) reasons.push("missing required field: academic");
      if (!facultyValue) reasons.push("missing required field: faculty");
      if (!departmentValue) reasons.push("missing required field: department");
      if (!semesterValue) reasons.push("missing required field: semester");

      // format checks
      const gender = normalizeGender(genderValue);
      if (genderValue && !gender) reasons.push("invalid gender (must be MALE or FEMALE)");
      if (email && !EMAIL_PATTERN.test(email)) reasons.push("malformed email");

      // relationship resolution
      const academicId = academicValue ? academicByYear.get(academicValue) : undefined;
      const facultyId = facultyValue ? facultyByName.get(facultyValue.toLowerCase()) : undefined;
      const departmentId = departmentValue ? departmentByName.get(departmentValue.toLowerCase()) : undefined;
      const semesterId = semesterValue ? semesterByName.get(semesterValue.toLowerCase()) : undefined;

      if (academicValue && academicId === undefined) reasons.push(`unknown academic year: ${academicValue}`);
      if (facultyValue && facultyId === undefined) reasons.push(`unknown faculty: ${facultyValue}`);
      if (departmentValue && departmentId === undefined) reasons.push(`unknown department: ${departmentValue}`);
      if (semesterValue && semesterId === undefined) reasons.push(`unknown semester: ${semesterValue}`);

      // duplicates (only checked when the value is otherwise present)
      if (rollNo && (existingRollSet.has(rollNo) || seenRoll.has(rollNo))) {
        reasons.push(existingRollSet.has(rollNo) ? "roll number already exists" : "duplicate roll number in file");
      }
      if (email && (existingStudentEmailSet.has(email) || existingUserEmailSet.has(email) || seenEmail.has(email))) {
        reasons.push(
          existingStudentEmailSet.has(email) || existingUserEmailSet.has(email)
            ? "email already exists"
            : "duplicate email in file"
        );
      }
      if (username && (existingUsernameSet.has(username) || seenUsername.has(username))) {
        reasons.push(existingUsernameSet.has(username) ? "username already exists" : "duplicate username in file");
      }

      // classification: duplicates are SKIPPED, other problems INVALID
      const hasDuplicate = reasons.some(
        (reason) =>
          reason.includes("already exists") ||
          reason.includes("duplicate")
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
      seenRoll.add(rollNo);
      seenEmail.add(email);
      seenUsername.add(username);

      results.push({ rowNumber, status: "VALID", reasons: [] });
      validRows.push({
        username,
        password,
        full_name: fullName,
        roll_no: rollNo,
        gender: gender as Gender,
        email,
        phone: phone || null,
        address: address || null,
        academic_id: academicId as number,
        faculty_id: facultyId as number,
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
    // HASH PASSWORDS (before the transaction)
    // =========================================

    const prepared: {
      username: string;
      password: string;
      full_name: string;
      roll_no: string;
      gender: Gender;
      email: string;
      phone: string | null;
      address: string | null;
      academic_id: number;
      faculty_id: number;
      department_id: number;
      semester_id: number;
    }[] = [];
    for (const row of validRows) {
      prepared.push({
        ...row,
        password: await bcrypt.hash(row.password, 10),
      });
    }

    // =========================================
    // SAVE (transactional - all or nothing)
    // =========================================

    try {
      await prisma.$transaction(async (tx) => {
        for (const row of prepared) {
          const user = await tx.user.create({
            data: {
              username: row.username,
              email: row.email,
              password: row.password,
              role: "STUDENT",
            },
          });

          await tx.student.create({
            data: {
              user_id: user.user_id,
              full_name: row.full_name,
              roll_no: row.roll_no,
              gender: row.gender,
              email: row.email,
              phone: row.phone,
              address: row.address,
              academic_id: row.academic_id,
              faculty_id: row.faculty_id,
              department_id: row.department_id,
              semester_id: row.semester_id,
            },
          });
        }
      });
    } catch (error) {
      console.log("BULK_UPLOAD_STUDENTS_SAVE_ERROR", error);
      return prismaErrorResponse(error, "Failed to import students");
    }

    void logActivity("BULK_IMPORT_STUDENTS", `Imported ${validRows.length} students, ${summary.skipped} skipped, ${summary.invalid} failed`);

    return NextResponse.json(
      {
        success: true,
        dryRun: false,
        summary,
        results: results.filter((r) => r.status !== "VALID"),
        imported: validRows.length,
        failed: summary.invalid,
        skipped: summary.skipped,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("BULK_UPLOAD_STUDENTS_ERROR", error);
    return prismaErrorResponse(error, "Failed to upload students");
  }
}
