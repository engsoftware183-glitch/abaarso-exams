// ======================================================
// CRUD MODULE CONFIGURATION
// ======================================================
//
// Declarative, schema-aligned configuration for the real database
// CRUD modules (Academics, Faculties, Departments, Semesters,
// Courses, Students). Every field below maps 1:1 to a column in the
// Prisma schema - nothing is invented here. Relationship dropdowns
// (faculty, department, academic, semester) are loaded from the real
// APIs at runtime, never hardcoded.
//
// IMPORTANT: this module is plain data (no functions) so the config
// objects can be passed from server pages into client components.

export type CrudFieldType =
  | "text"
  | "email"
  | "number"
  | "password"
  | "select"
  | "textarea"
  | "date";

export type CrudOption = {
  value: string | number;
  label: string;
};

export type CrudField = {
  name: string;
  label: string;
  type: CrudFieldType;
  required?: boolean;
  placeholder?: string;
  /** Static options (e.g. the Gender enum). */
  options?: CrudOption[];
  /** API path to load relationship options from (e.g. "/api/faculties"). */
  optionsApi?: string;
  /** Key of the id field inside each option row (defaults to field.name). */
  optionValue?: string;
  /** Key of the label field inside each option row (dotted path allowed). */
  optionLabel?: string;
  /** Filter options by watched parent field values (dependent dropdowns). */
  dependsOn?: { field: string; optionKey: string }[];
  /** Minimum for number/password fields. */
  min?: number;
  /** false = UI-only helper field, never submitted to the API. */
  store?: boolean;
  /** Restrict a field to the create or edit form only. */
  showOn?: "create" | "edit";
};

export type CrudColumn = {
  /** Dotted path into a row (e.g. "faculty.faculty_name"), or the
   *  relation count key when type is "count". */
  key: string;
  label: string;
  type?: "text" | "date" | "count" | "badge";
};

export type CrudFilter = {
  /** Query param name sent to the pagination API (e.g. "faculty_id"). */
  name: string;
  label: string;
  /** API path to load filter options from. Omit when using static options. */
  optionsApi?: string;
  /** Key of the id field inside each option row (required when using optionsApi). */
  optionValue?: string;
  /** Key of the label field inside each option row (required when using optionsApi). */
  optionLabel?: string;
  /** Static options (e.g. an enum like status). Mutually exclusive with optionsApi. */
  options?: CrudOption[];
};

export type CrudDetail = {
  key: string;
  label: string;
  type?: "text" | "date" | "count" | "badge";
};

export type CrudConfig = {
  title: string;
  description: string;
  entity: string;
  entityPlural: string;
  apiPath: string;
  /** Response key that holds the record list in the pagination API. */
  recordsKey: string;
  /** Primary key field name of the entity. */
  idKey: string;
  searchPlaceholder: string;
  columns: CrudColumn[];
  fields: CrudField[];
  filters?: CrudFilter[];
  details: CrudDetail[];
  /**
   * When set, an Export button is shown in the toolbar for managers.
   * The value is the API path for the export endpoint
   * (e.g. "/api/students/export").
   */
  exportPath?: string;
};

const genderOptions: CrudOption[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

// ======================================================
// ACADEMICS
// ======================================================

export const academicsConfig: CrudConfig = {
  title: "Academic Years",
  description: "Create, review, and maintain official academic calendar records.",
  entity: "Academic Year",
  entityPlural: "Academic Years",
  apiPath: "/api/academics",
  recordsKey: "academics",
  idKey: "academic_id",
  searchPlaceholder: "Search academic years…",
  columns: [
    { key: "year", label: "Academic Year" },
    { key: "semesters", label: "Semesters", type: "count" },
    { key: "students", label: "Students", type: "count" },
    { key: "created_at", label: "Created", type: "date" },
  ],
  fields: [
    {
      name: "year",
      label: "Academic Year",
      type: "text",
      required: true,
      placeholder: "e.g. 2026/2027",
    },
  ],
  details: [
    { key: "year", label: "Academic Year" },
    { key: "semesters", label: "Semesters", type: "count" },
    { key: "students", label: "Students", type: "count" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Last Updated", type: "date" },
  ],
};

// ======================================================
// FACULTIES
// ======================================================

export const facultiesConfig: CrudConfig = {
  title: "Faculties",
  description: "Manage the faculties that organise departments, semesters, and students.",
  entity: "Faculty",
  entityPlural: "Faculties",
  apiPath: "/api/faculties",
  recordsKey: "faculties",
  idKey: "faculty_id",
  searchPlaceholder: "Search faculties…",
  columns: [
    { key: "faculty_name", label: "Faculty Name" },
    { key: "departments", label: "Departments", type: "count" },
    { key: "students", label: "Students", type: "count" },
    { key: "created_at", label: "Created", type: "date" },
  ],
  fields: [
    {
      name: "faculty_name",
      label: "Faculty Name",
      type: "text",
      required: true,
      placeholder: "e.g. Faculty of Engineering",
    },
  ],
  details: [
    { key: "faculty_name", label: "Faculty Name" },
    { key: "departments", label: "Departments", type: "count" },
    { key: "students", label: "Students", type: "count" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Last Updated", type: "date" },
  ],
};

// ======================================================
// DEPARTMENTS
// ======================================================

export const departmentsConfig: CrudConfig = {
  title: "Departments",
  description: "Organise departments by faculty. Each department belongs to exactly one faculty.",
  entity: "Department",
  entityPlural: "Departments",
  apiPath: "/api/departments",
  recordsKey: "departments",
  idKey: "department_id",
  searchPlaceholder: "Search departments…",
  columns: [
    { key: "department_name", label: "Department Name" },
    { key: "faculty.faculty_name", label: "Faculty" },
    { key: "courses", label: "Courses", type: "count" },
    { key: "students", label: "Students", type: "count" },
  ],
  fields: [
    {
      name: "department_name",
      label: "Department Name",
      type: "text",
      required: true,
      placeholder: "e.g. Computer Science",
    },
    {
      name: "faculty_id",
      label: "Faculty",
      type: "select",
      required: true,
      optionsApi: "/api/faculties",
      optionValue: "faculty_id",
      optionLabel: "faculty_name",
    },
  ],
  filters: [
    {
      name: "faculty_id",
      label: "Faculty",
      optionsApi: "/api/faculties",
      optionValue: "faculty_id",
      optionLabel: "faculty_name",
    },
  ],
  details: [
    { key: "department_name", label: "Department Name" },
    { key: "faculty.faculty_name", label: "Faculty" },
    { key: "courses", label: "Courses", type: "count" },
    { key: "students", label: "Students", type: "count" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Last Updated", type: "date" },
  ],
};

// ======================================================
// SEMESTERS
// ======================================================

export const semestersConfig: CrudConfig = {
  title: "Semesters",
  description: "Maintain semester records. Each semester belongs to one academic year and one faculty.",
  entity: "Semester",
  entityPlural: "Semesters",
  apiPath: "/api/semesters",
  recordsKey: "semesters",
  idKey: "semester_id",
  searchPlaceholder: "Search semesters…",
  columns: [
    { key: "semester_name", label: "Semester" },
    { key: "academic.year", label: "Academic Year" },
    { key: "faculty.faculty_name", label: "Faculty" },
    { key: "courses", label: "Courses", type: "count" },
    { key: "students", label: "Students", type: "count" },
  ],
  fields: [
    {
      name: "semester_name",
      label: "Semester Name",
      type: "text",
      required: true,
      placeholder: "e.g. Semester 1",
    },
    {
      name: "academic_id",
      label: "Academic Year",
      type: "select",
      required: true,
      optionsApi: "/api/academics",
      optionValue: "academic_id",
      optionLabel: "year",
    },
    {
      name: "faculty_id",
      label: "Faculty",
      type: "select",
      required: true,
      optionsApi: "/api/faculties",
      optionValue: "faculty_id",
      optionLabel: "faculty_name",
    },
  ],
  filters: [
    {
      name: "academic_id",
      label: "Academic Year",
      optionsApi: "/api/academics",
      optionValue: "academic_id",
      optionLabel: "year",
    },
    {
      name: "faculty_id",
      label: "Faculty",
      optionsApi: "/api/faculties",
      optionValue: "faculty_id",
      optionLabel: "faculty_name",
    },
  ],
  details: [
    { key: "semester_name", label: "Semester Name" },
    { key: "academic.year", label: "Academic Year" },
    { key: "faculty.faculty_name", label: "Faculty" },
    { key: "courses", label: "Courses", type: "count" },
    { key: "students", label: "Students", type: "count" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Last Updated", type: "date" },
  ],
};

// ======================================================
// COURSES
// ======================================================

export const coursesConfig: CrudConfig = {
  title: "Courses",
  description: "Create courses with credit hours, assign departments and semesters, and review results.",
  entity: "Course",
  entityPlural: "Courses",
  apiPath: "/api/courses",
  exportPath: "/api/courses/export",
  recordsKey: "courses",
  idKey: "course_id",
  searchPlaceholder: "Search courses…",
  columns: [
    { key: "course_code", label: "Course Code" },
    { key: "course_name", label: "Course Name" },
    { key: "credit_hours", label: "Credit Hours" },
    { key: "department.department_name", label: "Department" },
    { key: "semester.semester_name", label: "Semester" },
  ],
  fields: [
    {
      name: "course_code",
      label: "Course Code",
      type: "text",
      required: true,
      placeholder: "e.g. CS201",
    },
    {
      name: "course_name",
      label: "Course Name",
      type: "text",
      required: true,
      placeholder: "e.g. Data Structures",
    },
    {
      name: "credit_hours",
      label: "Credit Hours",
      type: "number",
      required: true,
      min: 1,
      placeholder: "e.g. 3",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Optional course description",
    },
    {
      name: "faculty_id",
      label: "Faculty (filter)",
      type: "select",
      optionsApi: "/api/faculties",
      optionValue: "faculty_id",
      optionLabel: "faculty_name",
      store: false,
    },
    {
      name: "department_id",
      label: "Department",
      type: "select",
      required: true,
      optionsApi: "/api/departments",
      optionValue: "department_id",
      optionLabel: "department_name",
      dependsOn: [{ field: "faculty_id", optionKey: "faculty_id" }],
    },
    {
      name: "semester_id",
      label: "Semester",
      type: "select",
      required: true,
      optionsApi: "/api/semesters",
      optionValue: "semester_id",
      optionLabel: "semester_name",
    },
  ],
  filters: [
    {
      name: "department_id",
      label: "Department",
      optionsApi: "/api/departments",
      optionValue: "department_id",
      optionLabel: "department_name",
    },
    {
      name: "semester_id",
      label: "Semester",
      optionsApi: "/api/semesters",
      optionValue: "semester_id",
      optionLabel: "semester_name",
    },
  ],
  details: [
    { key: "course_code", label: "Course Code" },
    { key: "course_name", label: "Course Name" },
    { key: "credit_hours", label: "Credit Hours" },
    { key: "description", label: "Description" },
    { key: "department.department_name", label: "Department" },
    { key: "semester.semester_name", label: "Semester" },
    { key: "results", label: "Results", type: "count" },
    { key: "exams", label: "Exams", type: "count" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Last Updated", type: "date" },
  ],
};

// ======================================================
// STUDENTS
// ======================================================

export const studentsConfig: CrudConfig = {
  title: "Students",
  description: "Register students, update academic profiles, and review placement across years and faculties.",
  entity: "Student",
  entityPlural: "Students",
  apiPath: "/api/students",
  exportPath: "/api/students/export",
  recordsKey: "students",
  idKey: "student_id",
  searchPlaceholder: "Search students…",
  columns: [
    { key: "roll_no", label: "Roll Number" },
    { key: "full_name", label: "Full Name" },
    { key: "email", label: "Email" },
    { key: "gender", label: "Gender", type: "badge" },
    { key: "department.department_name", label: "Department" },
    { key: "semester.semester_name", label: "Semester" },
  ],
  fields: [
    {
      name: "full_name",
      label: "Full Name",
      type: "text",
      required: true,
      placeholder: "e.g. Amina Ahmed",
    },
    {
      name: "roll_no",
      label: "Roll Number",
      type: "text",
      required: true,
      placeholder: "e.g. ATU-2026-001",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "student@abaarso.edu",
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      required: true,
      options: genderOptions,
    },
    {
      name: "phone",
      label: "Phone",
      type: "text",
      placeholder: "Optional phone number",
    },
    {
      name: "address",
      label: "Address",
      type: "textarea",
      placeholder: "Optional residential address",
    },
    {
      name: "academic_id",
      label: "Academic Year",
      type: "select",
      required: true,
      optionsApi: "/api/academics",
      optionValue: "academic_id",
      optionLabel: "year",
    },
    {
      name: "faculty_id",
      label: "Faculty",
      type: "select",
      required: true,
      optionsApi: "/api/faculties",
      optionValue: "faculty_id",
      optionLabel: "faculty_name",
    },
    {
      name: "department_id",
      label: "Department",
      type: "select",
      required: true,
      optionsApi: "/api/departments",
      optionValue: "department_id",
      optionLabel: "department_name",
      dependsOn: [{ field: "faculty_id", optionKey: "faculty_id" }],
    },
    {
      name: "semester_id",
      label: "Semester",
      type: "select",
      required: true,
      optionsApi: "/api/semesters",
      optionValue: "semester_id",
      optionLabel: "semester_name",
      dependsOn: [
        { field: "faculty_id", optionKey: "faculty_id" },
        { field: "academic_id", optionKey: "academic_id" },
      ],
    },
    {
      name: "username",
      label: "Username",
      type: "text",
      required: true,
      placeholder: "Login username for the student account",
      showOn: "create",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      required: true,
      min: 6,
      placeholder: "Minimum 6 characters",
      showOn: "create",
    },
  ],
  filters: [
    {
      name: "academic_id",
      label: "Academic Year",
      optionsApi: "/api/academics",
      optionValue: "academic_id",
      optionLabel: "year",
    },
    {
      name: "faculty_id",
      label: "Faculty",
      optionsApi: "/api/faculties",
      optionValue: "faculty_id",
      optionLabel: "faculty_name",
    },
    {
      name: "department_id",
      label: "Department",
      optionsApi: "/api/departments",
      optionValue: "department_id",
      optionLabel: "department_name",
    },
    {
      name: "semester_id",
      label: "Semester",
      optionsApi: "/api/semesters",
      optionValue: "semester_id",
      optionLabel: "semester_name",
    },
  ],
  details: [
    { key: "full_name", label: "Full Name" },
    { key: "roll_no", label: "Roll Number" },
    { key: "email", label: "Email" },
    { key: "gender", label: "Gender", type: "badge" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "academic.year", label: "Academic Year" },
    { key: "faculty.faculty_name", label: "Faculty" },
    { key: "department.department_name", label: "Department" },
    { key: "semester.semester_name", label: "Semester" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Last Updated", type: "date" },
  ],
};

// ======================================================
// EXAMS
// ======================================================

export const examsConfig: CrudConfig = {
  title: "Exams",
  description: "Schedule examinations, set the total marks, and assign each exam to a course and semester.",
  entity: "Exam",
  entityPlural: "Exams",
  apiPath: "/api/exams",
  recordsKey: "exams",
  idKey: "exam_id",
  searchPlaceholder: "Search exams by course…",
  columns: [
    { key: "exam_type", label: "Type", type: "badge" },
    { key: "course.course_code", label: "Course Code" },
    { key: "course.course_name", label: "Course" },
    { key: "semester.semester_name", label: "Semester" },
    { key: "academic.year", label: "Academic Year" },
    { key: "exam_date", label: "Exam Date", type: "date" },
    { key: "total_marks", label: "Total Marks" },
  ],
  fields: [
    {
      name: "exam_type",
      label: "Exam Type",
      type: "select",
      required: true,
      options: [
        { value: "MIDTERM", label: "Midterm" },
        { value: "FINAL", label: "Final" },
      ],
    },
    {
      name: "total_marks",
      label: "Total Marks",
      type: "number",
      required: true,
      min: 1,
      placeholder: "e.g. 100",
    },
    {
      name: "exam_date",
      label: "Exam Date",
      type: "date",
      required: true,
    },
    {
      name: "academic_id",
      label: "Academic Year",
      type: "select",
      required: true,
      optionsApi: "/api/academics",
      optionValue: "academic_id",
      optionLabel: "year",
    },
    {
      name: "faculty_id",
      label: "Faculty",
      type: "select",
      required: true,
      optionsApi: "/api/faculties",
      optionValue: "faculty_id",
      optionLabel: "faculty_name",
    },
    {
      name: "semester_id",
      label: "Semester",
      type: "select",
      required: true,
      optionsApi: "/api/semesters",
      optionValue: "semester_id",
      optionLabel: "semester_name",
      dependsOn: [
        { field: "faculty_id", optionKey: "faculty_id" },
        { field: "academic_id", optionKey: "academic_id" },
      ],
    },
    {
      name: "course_id",
      label: "Course",
      type: "select",
      required: true,
      optionsApi: "/api/courses",
      optionValue: "course_id",
      optionLabel: "course_name",
      dependsOn: [{ field: "semester_id", optionKey: "semester_id" }],
    },
  ],
  filters: [
    {
      name: "academic_id",
      label: "Academic Year",
      optionsApi: "/api/academics",
      optionValue: "academic_id",
      optionLabel: "year",
    },
    {
      name: "faculty_id",
      label: "Faculty",
      optionsApi: "/api/faculties",
      optionValue: "faculty_id",
      optionLabel: "faculty_name",
    },
    {
      name: "semester_id",
      label: "Semester",
      optionsApi: "/api/semesters",
      optionValue: "semester_id",
      optionLabel: "semester_name",
    },
    {
      name: "course_id",
      label: "Course",
      optionsApi: "/api/courses",
      optionValue: "course_id",
      optionLabel: "course_code",
    },
  ],
  details: [
    { key: "exam_type", label: "Exam Type", type: "badge" },
    { key: "course.course_code", label: "Course Code" },
    { key: "course.course_name", label: "Course" },
    { key: "semester.semester_name", label: "Semester" },
    { key: "academic.year", label: "Academic Year" },
    { key: "faculty.faculty_name", label: "Faculty" },
    { key: "exam_date", label: "Exam Date", type: "date" },
    { key: "total_marks", label: "Total Marks" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Last Updated", type: "date" },
  ],
};

// ======================================================
// STUDENT EXAMS
// ======================================================

export const studentExamsConfig: CrudConfig = {
  title: "Student Exam Marks",
  description: "Record and validate the marks each student scored in an exam. Marks are checked against the exam's total.",
  entity: "Student Exam Mark",
  entityPlural: "Student Exam Marks",
  apiPath: "/api/student-exams",
  recordsKey: "studentExams",
  idKey: "student_exam_id",
  searchPlaceholder: "Search by student or course…",
  columns: [
    { key: "student.full_name", label: "Student" },
    { key: "student.roll_no", label: "Roll No" },
    { key: "exam.course.course_code", label: "Course Code" },
    { key: "exam.course.course_name", label: "Course" },
    { key: "exam.exam_type", label: "Exam", type: "badge" },
    { key: "exam.exam_date", label: "Date", type: "date" },
    { key: "marks", label: "Marks" },
    { key: "exam.total_marks", label: "Out Of" },
  ],
  fields: [
    {
      name: "student_id",
      label: "Student",
      type: "select",
      required: true,
      optionsApi: "/api/students",
      optionValue: "student_id",
      optionLabel: "full_name",
      showOn: "create",
    },
    {
      name: "exam_id",
      label: "Exam",
      type: "select",
      required: true,
      optionsApi: "/api/exams",
      optionValue: "exam_id",
      optionLabel: "course.course_name",
      showOn: "create",
    },
    {
      name: "marks",
      label: "Marks",
      type: "number",
      required: true,
      min: 0,
      placeholder: "Marks scored (max = exam total)",
    },
  ],
  filters: [
    {
      name: "exam_id",
      label: "Exam",
      optionsApi: "/api/exams",
      optionValue: "exam_id",
      optionLabel: "course.course_name",
    },
  ],
  details: [
    { key: "student.full_name", label: "Student" },
    { key: "student.roll_no", label: "Roll No" },
    { key: "exam.course.course_code", label: "Course Code" },
    { key: "exam.course.course_name", label: "Course" },
    { key: "exam.exam_type", label: "Exam Type", type: "badge" },
    { key: "exam.exam_date", label: "Exam Date", type: "date" },
    { key: "marks", label: "Marks" },
    { key: "exam.total_marks", label: "Out Of" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Last Updated", type: "date" },
  ],
};

// ======================================================
// ATTENDANCE
// ======================================================

export const attendanceConfig: CrudConfig = {
  title: "Attendance",
  description: "Record attendance marks per student and course. The percentage is calculated automatically (mark × 10).",
  entity: "Attendance Record",
  entityPlural: "Attendance Records",
  apiPath: "/api/attendance",
  recordsKey: "attendances",
  idKey: "attendance_id",
  searchPlaceholder: "Search by student or course…",
  columns: [
    { key: "student.full_name", label: "Student" },
    { key: "student.roll_no", label: "Roll No" },
    { key: "course.course_code", label: "Course Code" },
    { key: "course.course_name", label: "Course" },
    { key: "attendance_mark", label: "Mark" },
    { key: "attendance_percent", label: "Percent" },
  ],
  fields: [
    {
      name: "student_id",
      label: "Student",
      type: "select",
      required: true,
      optionsApi: "/api/students",
      optionValue: "student_id",
      optionLabel: "full_name",
    },
    {
      name: "course_id",
      label: "Course",
      type: "select",
      required: true,
      optionsApi: "/api/courses",
      optionValue: "course_id",
      optionLabel: "course_code",
    },
    {
      name: "attendance_mark",
      label: "Attendance Mark",
      type: "number",
      required: true,
      min: 0,
      placeholder: "0 – 10 (percent is mark × 10)",
    },
  ],
  filters: [
    {
      name: "course_id",
      label: "Course",
      optionsApi: "/api/courses",
      optionValue: "course_id",
      optionLabel: "course_code",
    },
  ],
  details: [
    { key: "student.full_name", label: "Student" },
    { key: "student.roll_no", label: "Roll No" },
    { key: "course.course_code", label: "Course Code" },
    { key: "course.course_name", label: "Course" },
    { key: "attendance_mark", label: "Mark" },
    { key: "attendance_percent", label: "Percent" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Last Updated", type: "date" },
  ],
};

// ======================================================
// ASSESSMENTS
// ======================================================

export const assessmentsConfig: CrudConfig = {
  title: "Assessments",
  description: "Enter assignment and quiz marks per student and course. The total is calculated automatically.",
  entity: "Assessment",
  entityPlural: "Assessments",
  apiPath: "/api/assessment",
  recordsKey: "assessments",
  idKey: "assessment_id",
  searchPlaceholder: "Search by student or course…",
  columns: [
    { key: "student.full_name", label: "Student" },
    { key: "student.roll_no", label: "Roll No" },
    { key: "course.course_code", label: "Course Code" },
    { key: "course.course_name", label: "Course" },
    { key: "assignment_mark", label: "Assignment" },
    { key: "quiz_mark", label: "Quiz" },
    { key: "total_assessment", label: "Total" },
  ],
  fields: [
    {
      name: "student_id",
      label: "Student",
      type: "select",
      required: true,
      optionsApi: "/api/students",
      optionValue: "student_id",
      optionLabel: "full_name",
    },
    {
      name: "course_id",
      label: "Course",
      type: "select",
      required: true,
      optionsApi: "/api/courses",
      optionValue: "course_id",
      optionLabel: "course_code",
    },
    {
      name: "assignment_mark",
      label: "Assignment Mark",
      type: "number",
      required: true,
      min: 0,
      placeholder: "e.g. 20",
    },
    {
      name: "quiz_mark",
      label: "Quiz Mark",
      type: "number",
      required: true,
      min: 0,
      placeholder: "e.g. 10",
    },
  ],
  filters: [
    {
      name: "course_id",
      label: "Course",
      optionsApi: "/api/courses",
      optionValue: "course_id",
      optionLabel: "course_code",
    },
  ],
  details: [
    { key: "student.full_name", label: "Student" },
    { key: "student.roll_no", label: "Roll No" },
    { key: "course.course_code", label: "Course Code" },
    { key: "course.course_name", label: "Course" },
    { key: "assignment_mark", label: "Assignment Mark" },
    { key: "quiz_mark", label: "Quiz Mark" },
    { key: "total_assessment", label: "Total Assessment" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Last Updated", type: "date" },
  ],
};

// ======================================================
// RESULTS
// ======================================================

export const resultsConfig: CrudConfig = {
  title: "Results",
  description: "Review computed results. Adding a result recalculates it from attendance, assessment, and exam marks.",
  entity: "Result",
  entityPlural: "Results",
  apiPath: "/api/results",
  exportPath: "/api/results/export",
  recordsKey: "results",
  idKey: "result_id",
  searchPlaceholder: "Search by student, course, or grade…",
  columns: [
    { key: "student.full_name", label: "Student" },
    { key: "student.roll_no", label: "Roll No" },
    { key: "course.course_code", label: "Course Code" },
    { key: "course.course_name", label: "Course" },
    { key: "semester.semester_name", label: "Semester" },
    { key: "total_marks", label: "Total" },
    { key: "grade", label: "Grade", type: "badge" },
    { key: "gpa", label: "GPA" },
    { key: "status", label: "Status", type: "badge" },
  ],
  fields: [
    {
      name: "student_id",
      label: "Student",
      type: "select",
      required: true,
      optionsApi: "/api/students",
      optionValue: "student_id",
      optionLabel: "full_name",
      showOn: "create",
    },
    {
      name: "semester_id",
      label: "Semester",
      type: "select",
      required: true,
      optionsApi: "/api/semesters",
      optionValue: "semester_id",
      optionLabel: "semester_name",
      showOn: "create",
    },
    {
      name: "course_id",
      label: "Course",
      type: "select",
      required: true,
      optionsApi: "/api/courses",
      optionValue: "course_id",
      optionLabel: "course_name",
      dependsOn: [{ field: "semester_id", optionKey: "semester_id" }],
      showOn: "create",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "DRAFT", label: "Draft" },
        { value: "PUBLISHED", label: "Published" },
      ],
    },
  ],
  filters: [
    {
      name: "semester_id",
      label: "Semester",
      optionsApi: "/api/semesters",
      optionValue: "semester_id",
      optionLabel: "semester_name",
    },
    {
      name: "course_id",
      label: "Course",
      optionsApi: "/api/courses",
      optionValue: "course_id",
      optionLabel: "course_code",
    },
    {
      name: "status",
      label: "Status",
      options: [
        { value: "DRAFT", label: "Draft" },
        { value: "PUBLISHED", label: "Published" },
      ],
    },
  ],
  details: [
    { key: "student.full_name", label: "Student" },
    { key: "student.roll_no", label: "Roll No" },
    { key: "student.email", label: "Email" },
    { key: "course.course_code", label: "Course Code" },
    { key: "course.course_name", label: "Course" },
    { key: "semester.semester_name", label: "Semester" },
    { key: "total_marks", label: "Total Marks" },
    { key: "grade", label: "Grade", type: "badge" },
    { key: "gpa", label: "GPA" },
    { key: "remarks", label: "Remarks" },
    { key: "status", label: "Status", type: "badge" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Last Updated", type: "date" },
  ],
};
