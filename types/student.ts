export type Gender = "MALE" | "FEMALE";

export type Academic = {
  academic_id: number;
  year: string;
};

export type Faculty = {
  faculty_id: number;
  faculty_name: string;
};

export type Department = {
  department_id: number;
  department_name: string;
  faculty_id: number;
};

export type Semester = {
  semester_id: number;
  semester_name: string;
  academic_id: number;
  faculty_id: number;
};

export type Student = {
  student_id: number;
  user_id: number;
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
  academic: Academic;
  faculty: Faculty;
  department: Department;
  semester: Semester;
  created_at: string;
  updated_at: string;
};

export type StudentExamRecord = {
  student_exam_id: number;
  marks: number;
  exam: {
    exam_id: number;
    exam_type: string;
    total_marks: number;
    exam_date: string;
  };
};

export type StudentWithExams = Student & {
  studentExams: StudentExamRecord[];
};

export type Course = {
  course_id: number;
  course_name: string;
  course_code: string;
};

export type AttendanceRecord = {
  attendance_id: number;
  attendance_mark: number;
  attendance_percent: number;
  course: Course;
};

export type AssessmentRecord = {
  assessment_id: number;
  assignment_mark: number;
  quiz_mark: number;
  total_assessment: number;
  course: Course;
};

export type ResultRecord = {
  result_id: number;
  total_marks: number;
  grade: string | null;
  gpa: number;
  remarks: string | null;
  status: "DRAFT" | "PUBLISHED";
  course_id: number;
  semester_id: number;
};

export type StudentProfile = Student & {
  attendances: AttendanceRecord[];
  assessments: AssessmentRecord[];
  results: ResultRecord[];
  semester: Semester & {
    courses: Course[];
  };
};

export type StudentsListResponse = {
  success: boolean;
  count: number;
  students: StudentWithExams[];
};

export type StudentResponse = {
  success: boolean;
  student: StudentProfile;
};

export type AcademicsResponse = { success: boolean; count: number; academics: Academic[] };
export type FacultiesResponse = { success: boolean; count: number; faculties: Faculty[] };
export type DepartmentsResponse = { success: boolean; count: number; departments: Department[] };
export type SemestersResponse = { success: boolean; count: number; semesters: Semester[] };
