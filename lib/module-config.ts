import type { UploadKind } from "@/types/upload";

export type ModuleField = {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  options?: string[];
};

export type ModuleConfig = {
  title: string;
  description: string;
  entity: string;
  apiPath?: string;
  columns: string[];
  fields: ModuleField[];
  uploads?: UploadKind[];
  filters: string[];
};

const standardStatuses = ["Active", "Draft", "Published", "Pending Review"];

export const moduleConfigs: Record<string, ModuleConfig> = {
  academics: {
    title: "Academic Years",
    description: "Create, review, and maintain official academic calendar records.",
    entity: "Academic Year",
    apiPath: "/api/academics",
    columns: ["Academic Year", "Status", "Semesters", "Created"],
    fields: [
      { name: "year", label: "Academic year", type: "text", required: true },
      { name: "status", label: "Status", type: "select", options: standardStatuses, required: true },
    ],
    uploads: ["spreadsheet"],
    filters: ["Status", "Year"],
  },
  faculties: {
    title: "Faculties",
    description: "Manage faculties, supporting documents, departments, and performance records.",
    entity: "Faculty",
    apiPath: "/api/faculties",
    columns: ["Faculty Name", "Departments", "Students", "Status"],
    fields: [
      { name: "faculty_name", label: "Faculty name", type: "text", required: true },
      { name: "faculty_code", label: "Faculty code", type: "text" },
    ],
    uploads: ["image", "document", "spreadsheet"],
    filters: ["Status", "Academic Year"],
  },
  departments: {
    title: "Departments",
    description: "Organise departments by faculty, semester, and academic year.",
    entity: "Department",
    apiPath: "/api/departments",
    columns: ["Department Name", "Faculty", "Courses", "Status"],
    fields: [
      { name: "department_name", label: "Department name", type: "text", required: true },
      { name: "faculty", label: "Faculty", type: "select", options: ["ICT", "Business", "Health Sciences"], required: true },
    ],
    uploads: ["image", "document", "spreadsheet"],
    filters: ["Faculty", "Academic Year"],
  },
  semesters: {
    title: "Semesters",
    description: "Maintain semester records, course loads, students, exams, and result status.",
    entity: "Semester",
    apiPath: "/api/semesters",
    columns: ["Semester", "Academic Year", "Courses", "Result Status"],
    fields: [
      { name: "semester_name", label: "Semester name", type: "text", required: true },
      { name: "academic_year", label: "Academic year", type: "select", options: ["2026", "2025", "2024"], required: true },
    ],
    uploads: ["spreadsheet"],
    filters: ["Academic Year", "Faculty"],
  },
  courses: {
    title: "Courses",
    description: "Create courses, attach syllabi, assign semesters, and review performance.",
    entity: "Course",
    apiPath: "/api/courses",
    columns: ["Course Code", "Course Name", "Credit Hours", "Department"],
    fields: [
      { name: "course_code", label: "Course code", type: "text", required: true },
      { name: "course_name", label: "Course name", type: "text", required: true },
      { name: "credit_hours", label: "Credit hours", type: "number", required: true },
      { name: "description", label: "Description", type: "textarea" },
    ],
    uploads: ["document", "spreadsheet"],
    filters: ["Faculty", "Department", "Semester"],
  },
  students: {
    title: "Students",
    description: "Register students, update academic profiles, and review uploaded admission documents.",
    entity: "Student",
    apiPath: "/api/students",
    columns: ["Student ID", "Full Name", "Roll Number", "Department", "Status"],
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "roll_no", label: "Roll number", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "gender", label: "Gender", type: "select", options: ["MALE", "FEMALE"], required: true },
    ],
    uploads: ["image", "document", "spreadsheet"],
    filters: ["Faculty", "Department", "Semester", "Status"],
  },
  administrators: {
    title: "Administrators",
    description: "Manage system administrators and role-based staff access.",
    entity: "Administrator",
    apiPath: "/api/admins",
    columns: ["Full Name", "Email", "Role", "Status"],
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "role", label: "Role", type: "select", options: ["SUPER_ADMIN", "ADMIN", "STUDENT"], required: true },
    ],
    uploads: ["image", "document"],
    filters: ["Role", "Status"],
  },
  users: {
    title: "Users",
    description: "Review system users, authentication roles, and account status.",
    entity: "User",
    columns: ["Username", "Email", "Role", "Created"],
    fields: [
      { name: "username", label: "Username", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "role", label: "Role", type: "select", options: ["SUPER_ADMIN", "ADMIN", "STUDENT"], required: true },
    ],
    filters: ["Role", "Status"],
  },
  attendance: {
    title: "Attendance",
    description: "Record attendance marks with course, semester, and student filters.",
    entity: "Attendance Record",
    apiPath: "/api/attendance",
    columns: ["Student", "Course", "Attendance Mark", "Status"],
    fields: [
      { name: "student", label: "Student", type: "text", required: true },
      { name: "course", label: "Course", type: "text", required: true },
      { name: "attendance_mark", label: "Attendance mark", type: "number", required: true },
    ],
    uploads: ["spreadsheet"],
    filters: ["Course", "Semester", "Student"],
  },
  assessments: {
    title: "Assessments",
    description: "Enter assignment and quiz marks with automatic total preview.",
    entity: "Assessment",
    apiPath: "/api/assessment",
    columns: ["Student", "Course", "Assignment", "Quiz", "Total"],
    fields: [
      { name: "student", label: "Student", type: "text", required: true },
      { name: "course", label: "Course", type: "text", required: true },
      { name: "assignment_mark", label: "Assignment mark", type: "number", required: true },
      { name: "quiz_mark", label: "Quiz mark", type: "number", required: true },
    ],
    uploads: ["spreadsheet"],
    filters: ["Course", "Semester", "Student"],
  },
  exams: {
    title: "Exams",
    description: "Create exams, upload papers, attach marking schemes, and monitor marks entry.",
    entity: "Exam",
    apiPath: "/api/exams",
    columns: ["Exam Type", "Course", "Date", "Total Marks", "Status"],
    fields: [
      { name: "exam_type", label: "Exam type", type: "select", options: ["MIDTERM", "FINAL"], required: true },
      { name: "total_marks", label: "Total marks", type: "number", required: true },
      { name: "exam_date", label: "Exam date", type: "date", required: true },
    ],
    uploads: ["document", "spreadsheet"],
    filters: ["Exam Type", "Faculty", "Semester", "Course"],
  },
  "student-exams": {
    title: "Student Exam Marks",
    description: "Enter and validate student exam marks with bulk import support.",
    entity: "Student Exam Mark",
    apiPath: "/api/student-exams",
    columns: ["Student", "Exam", "Marks", "Validation"],
    fields: [
      { name: "student", label: "Student", type: "text", required: true },
      { name: "exam", label: "Exam", type: "text", required: true },
      { name: "marks", label: "Marks", type: "number", required: true },
    ],
    uploads: ["spreadsheet"],
    filters: ["Exam", "Course", "Semester"],
  },
  results: {
    title: "Results",
    description: "Generate, review, publish, and audit student results from backend calculations.",
    entity: "Result",
    columns: ["Student", "Course", "Total Marks", "Grade", "Status"],
    fields: [
      { name: "student", label: "Student", type: "text", required: true },
      { name: "course", label: "Course", type: "text", required: true },
      { name: "semester", label: "Semester", type: "text", required: true },
    ],
    uploads: ["document", "spreadsheet"],
    filters: ["Status", "Course", "Semester"],
  },
  transcripts: {
    title: "All Transcripts",
    description: "Search, preview, print, and download verified student transcripts.",
    entity: "Transcript",
    apiPath: "/api/transcripts",
    columns: ["Student ID", "Full Name", "Roll Number", "CGPA", "Actions"],
    fields: [
      { name: "student_id", label: "Student ID", type: "text", required: true },
      { name: "verification_note", label: "Verification note", type: "textarea" },
    ],
    uploads: ["document"],
    filters: ["Faculty", "Department", "Academic Year"],
  },
  reports: {
    title: "Reports",
    description: "Create filtered printable academic and examination reports.",
    entity: "Report",
    columns: ["Report", "Scope", "Updated", "Export"],
    fields: [
      { name: "report_name", label: "Report name", type: "text", required: true },
      { name: "date_range", label: "Date range", type: "text" },
    ],
    filters: ["Academic Year", "Semester", "Faculty", "Department"],
  },
  tools: {
    title: "Data Tools",
    description: "Import, export, and validate university records with clear review steps.",
    entity: "Data Job",
    columns: ["Job", "Type", "Rows", "Status"],
    fields: [
      { name: "job_name", label: "Job name", type: "text", required: true },
      { name: "job_type", label: "Job type", type: "select", options: ["Import", "Export", "Bulk Upload"], required: true },
    ],
    uploads: ["spreadsheet"],
    filters: ["Type", "Status"],
  },
  profile: {
    title: "Profile",
    description: "Update profile details, avatar, identity information, and account preferences.",
    entity: "Profile",
    columns: ["Setting", "Value", "Status"],
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "text" },
    ],
    uploads: ["image", "document"],
    filters: ["Status"],
  },
  settings: {
    title: "Settings",
    description: "Maintain ATU branding, report headers, security preferences, and system defaults.",
    entity: "Setting",
    columns: ["Setting", "Area", "Updated", "Status"],
    fields: [
      { name: "university_name", label: "University name", type: "text", required: true },
      { name: "system_title", label: "System title", type: "text", required: true },
    ],
    uploads: ["image", "document"],
    filters: ["Area", "Status"],
  },
  "audit-logs": {
    title: "Audit Logs",
    description: "Review important system activity, record changes, and access events.",
    entity: "Audit Entry",
    columns: ["User", "Action", "Module", "Time"],
    fields: [
      { name: "keyword", label: "Audit keyword", type: "text" },
      { name: "date", label: "Date", type: "date" },
    ],
    filters: ["Module", "Role", "Date"],
  },
};

export function getModuleConfig(key: string) {
  return moduleConfigs[key] ?? moduleConfigs.reports;
}
