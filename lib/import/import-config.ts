// ======================================================
// IMPORT COLUMN DEFINITIONS (Students + Courses + Academics + Faculties + Departments + Semesters + Attendance + Assessments + Exams + Student Exam Marks)
// ======================================================
//
// Shared plain-data module used by BOTH the client (template
// download, header quick-check) and the server (header mapping,
// row validation). Every field maps 1:1 to a real Prisma schema
// column or a real relationship - nothing is invented here.
//
// Relationship columns use human-readable values (academic year,
// faculty/department/semester names) that the server resolves
// deterministically to real database IDs.

export type ImportFieldKind = "text" | "email" | "number" | "enum" | "password" | "relationship";

export type ImportField = {
  /** Canonical field name (matches the schema/API). */
  key: string;
  /** Expected CSV/XLSX header. */
  header: string;
  required: boolean;
  kind: ImportFieldKind;
  /** Allowed values for kind === "enum". */
  enumValues?: string[];
  /** Which reference table a relationship value resolves against. */
  relation?: "academic" | "faculty" | "department" | "semester" | "student" | "course";
};

export type ImportModuleConfig = {
  key: "students" | "courses" | "academics" | "faculties" | "departments" | "semesters" | "attendance" | "assessments" | "exams" | "student-exams";
  label: string;
  endpoint: string;
  maxRows: number;
  fields: ImportField[];
};

export const STUDENT_IMPORT_FIELDS: ImportField[] = [
  { key: "username", header: "username", required: true, kind: "text" },
  { key: "password", header: "password", required: true, kind: "password" },
  { key: "full_name", header: "full_name", required: true, kind: "text" },
  { key: "roll_no", header: "roll_no", required: true, kind: "text" },
  { key: "gender", header: "gender", required: true, kind: "enum", enumValues: ["MALE", "FEMALE"] },
  { key: "email", header: "email", required: true, kind: "email" },
  { key: "phone", header: "phone", required: false, kind: "text" },
  { key: "address", header: "address", required: false, kind: "text" },
  { key: "academic", header: "academic", required: true, kind: "relationship", relation: "academic" },
  { key: "faculty", header: "faculty", required: true, kind: "relationship", relation: "faculty" },
  { key: "department", header: "department", required: true, kind: "relationship", relation: "department" },
  { key: "semester", header: "semester", required: true, kind: "relationship", relation: "semester" },
];

export const COURSE_IMPORT_FIELDS: ImportField[] = [
  { key: "course_name", header: "course_name", required: true, kind: "text" },
  { key: "course_code", header: "course_code", required: true, kind: "text" },
  { key: "credit_hours", header: "credit_hours", required: true, kind: "number" },
  { key: "description", header: "description", required: false, kind: "text" },
  { key: "department", header: "department", required: true, kind: "relationship", relation: "department" },
  { key: "semester", header: "semester", required: true, kind: "relationship", relation: "semester" },
];

export const ACADEMIC_IMPORT_FIELDS: ImportField[] = [
  { key: "year", header: "year", required: true, kind: "text" },
];

export const FACULTY_IMPORT_FIELDS: ImportField[] = [
  { key: "faculty_name", header: "faculty_name", required: true, kind: "text" },
];

export const DEPARTMENT_IMPORT_FIELDS: ImportField[] = [
  { key: "department_name", header: "department_name", required: true, kind: "text" },
  { key: "faculty", header: "faculty", required: true, kind: "relationship", relation: "faculty" },
];

export const SEMESTER_IMPORT_FIELDS: ImportField[] = [
  { key: "semester_name", header: "semester_name", required: true, kind: "text" },
  { key: "academic", header: "academic", required: true, kind: "relationship", relation: "academic" },
  { key: "faculty", header: "faculty", required: true, kind: "relationship", relation: "faculty" },
];

export const ATTENDANCE_IMPORT_FIELDS: ImportField[] = [
  { key: "student", header: "student", required: true, kind: "relationship", relation: "student" },
  { key: "course", header: "course", required: true, kind: "relationship", relation: "course" },
  { key: "attendance_mark", header: "attendance_mark", required: true, kind: "number" },
  { key: "attendance_percent", header: "attendance_percent", required: true, kind: "number" },
];

export const ASSESSMENT_IMPORT_FIELDS: ImportField[] = [
  { key: "student", header: "student", required: true, kind: "relationship", relation: "student" },
  { key: "course", header: "course", required: true, kind: "relationship", relation: "course" },
  { key: "assignment_mark", header: "assignment_mark", required: true, kind: "number" },
  { key: "quiz_mark", header: "quiz_mark", required: true, kind: "number" },
];

export const EXAM_IMPORT_FIELDS: ImportField[] = [
  { key: "exam_type", header: "exam_type", required: true, kind: "enum", enumValues: ["MIDTERM", "FINAL"] },
  { key: "total_marks", header: "total_marks", required: true, kind: "number" },
  { key: "exam_date", header: "exam_date", required: true, kind: "text" },
  { key: "academic", header: "academic", required: true, kind: "relationship", relation: "academic" },
  { key: "faculty", header: "faculty", required: true, kind: "relationship", relation: "faculty" },
  { key: "semester", header: "semester", required: true, kind: "relationship", relation: "semester" },
  { key: "course", header: "course", required: true, kind: "relationship", relation: "course" },
];

export const STUDENT_EXAM_IMPORT_FIELDS: ImportField[] = [
  { key: "student", header: "student", required: true, kind: "relationship", relation: "student" },
  { key: "exam_id", header: "exam_id", required: true, kind: "number" },
  { key: "marks", header: "marks", required: true, kind: "number" },
];

export const IMPORT_MODULES: Record<"students" | "courses" | "academics" | "faculties" | "departments" | "semesters" | "attendance" | "assessments" | "exams" | "student-exams", ImportModuleConfig> = {
  students: {
    key: "students",
    label: "Students",
    endpoint: "/api/students/bulk-upload",
    maxRows: 200,
    fields: STUDENT_IMPORT_FIELDS,
  },
  courses: {
    key: "courses",
    label: "Courses",
    endpoint: "/api/courses/bulk-upload",
    maxRows: 500,
    fields: COURSE_IMPORT_FIELDS,
  },
  academics: {
    key: "academics",
    label: "Academics",
    endpoint: "/api/academics/bulk-upload",
    maxRows: 500,
    fields: ACADEMIC_IMPORT_FIELDS,
  },
  faculties: {
    key: "faculties",
    label: "Faculties",
    endpoint: "/api/faculties/bulk-upload",
    maxRows: 500,
    fields: FACULTY_IMPORT_FIELDS,
  },
  departments: {
    key: "departments",
    label: "Departments",
    endpoint: "/api/departments/bulk-upload",
    maxRows: 500,
    fields: DEPARTMENT_IMPORT_FIELDS,
  },
  semesters: {
    key: "semesters",
    label: "Semesters",
    endpoint: "/api/semesters/bulk-upload",
    maxRows: 500,
    fields: SEMESTER_IMPORT_FIELDS,
  },
  attendance: {
    key: "attendance",
    label: "Attendance",
    endpoint: "/api/attendance/bulk-upload",
    maxRows: 500,
    fields: ATTENDANCE_IMPORT_FIELDS,
  },
  assessments: {
    key: "assessments",
    label: "Assessments",
    endpoint: "/api/assessment/bulk-upload",
    maxRows: 500,
    fields: ASSESSMENT_IMPORT_FIELDS,
  },
  exams: {
    key: "exams",
    label: "Exams",
    endpoint: "/api/exams/bulk-upload",
    maxRows: 500,
    fields: EXAM_IMPORT_FIELDS,
  },
  "student-exams": {
    key: "student-exams",
    label: "Student Exam Marks",
    endpoint: "/api/student-exams/bulk-upload",
    maxRows: 500,
    fields: STUDENT_EXAM_IMPORT_FIELDS,
  },
};

/** Normalize a header cell for case-insensitive matching. */
export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

/** Map raw header cells to canonical field keys (order preserved). */
export function mapHeaders(headers: string[], fields: ImportField[]): Map<string, number> {
  const byHeader = new Map(fields.map((field) => [normalizeHeader(field.header), field.key]));
  const map = new Map<string, number>();

  headers.forEach((header, index) => {
    const key = byHeader.get(normalizeHeader(header));
    if (key && !map.has(key)) {
      map.set(key, index);
    }
  });

  return map;
}

/** Required headers that are missing from the uploaded file. */
export function missingRequiredHeaders(headers: string[], fields: ImportField[]): string[] {
  const present = new Set(mapHeaders(headers, fields).keys());
  return fields.filter((field) => field.required && !present.has(field.key)).map((field) => field.header);
}
