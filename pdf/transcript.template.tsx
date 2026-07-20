/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

export interface Student {
  student_id: number;
  full_name: string;
  roll_no: string;
  email: string;
  faculty: string;
  department: string;
  academic_year: string;
  programme?: string;
  batch?: string;
  admission_date?: string;
  current_status?: string;
  transcript_date?: string;
}

export interface Course {
  course_code: string;
  course_name: string;
  credit_hours: number;
  attendance_mark: number;
  assignment_mark: number;
  quiz_mark: number;
  midterm_mark: number;
  final_mark: number;
  total_marks: number;
  grade: string;
  gpa: number;
}

export interface Semester {
  semester_name: string;
  courses: Course[];
  total_credit_hours: number;
  semester_gpa: number;
}

export interface Summary {
  total_semesters: number;
  total_courses: number;
  total_credit_hours: number;
  cgpa: number;
  academicStanding?: string;
  finalResult?: string;
}

export interface TranscriptProps {
  student: Student;
  semesters: Semester[];
  summary: Summary;
  logo: string;
  qrCode: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#0B0F14",
    fontFamily: "Helvetica",
    color: "#FFFFFF",
    flexDirection: "column",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#22C55E",
    paddingBottom: 10,
    marginBottom: 15,
  },
  logoContainer: {
    width: "20%",
  },
  logo: {
    width: 60,
    height: 60,
  },
  titleContainer: {
    width: "60%",
    alignItems: "center",
  },
  uniName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#22C55E",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  docTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    marginTop: 3,
    letterSpacing: 1,
    textAlign: "center",
  },
  facultyName: {
    fontSize: 9,
    color: "#9CA3AF",
    marginTop: 2,
    textAlign: "center",
  },
  qrContainer: {
    width: "20%",
    alignItems: "center",
  },
  qrCode: {
    width: 55,
    height: 55,
    backgroundColor: "#FFFFFF",
    padding: 2,
    borderRadius: 4,
  },
  qrText: {
    fontSize: 6,
    color: "#9CA3AF",
    marginTop: 3,
    textAlign: "center",
  },
  studentCard: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#111827",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardColumn: {
    width: "48%",
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 4,
    fontSize: 8,
  },
  infoLabel: {
    color: "#9CA3AF",
    width: "35%",
    fontFamily: "Helvetica-Bold",
  },
  infoValue: {
    color: "#FFFFFF",
    width: "65%",
  },
  semesterSection: {
    marginBottom: 15,
  },
  semesterName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#22C55E",
    marginBottom: 5,
  },
  table: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingVertical: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingVertical: 3,
  },
  colCode: { width: "12%", fontSize: 7, paddingLeft: 4 },
  colTitle: { width: "22%", fontSize: 7 },
  colCredit: { width: "8%", fontSize: 7, textAlign: "center" },
  colAttendance: { width: "8%", fontSize: 7, textAlign: "center" },
  colAssignment: { width: "8%", fontSize: 7, textAlign: "center" },
  colQuiz: { width: "6%", fontSize: 7, textAlign: "center" },
  colMidterm: { width: "8%", fontSize: 7, textAlign: "center" },
  colFinal: { width: "8%", fontSize: 7, textAlign: "center" },
  colTotal: { width: "8%", fontSize: 7, textAlign: "center" },
  colGrade: { width: "6%", fontSize: 7, textAlign: "center", fontFamily: "Helvetica-Bold", color: "#22C55E" },
  colGpa: { width: "6%", fontSize: 7, textAlign: "center" },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    color: "#9CA3AF",
  },
  semesterFooterLine: {
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    borderStyle: "dashed",
    marginVertical: 4,
  },
  semesterSummaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 10,
    marginVertical: 2,
  },
  semesterSummaryLabel: {
    fontSize: 8,
    color: "#9CA3AF",
    marginLeft: 15,
  },
  semesterSummaryValue: {
    fontFamily: "Helvetica-Bold",
    color: "#22C55E",
  },
  overallSummaryCard: {
    borderWidth: 1,
    borderColor: "#22C55E",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#111827",
    marginBottom: 15,
  },
  overallSummaryTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#22C55E",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 1,
  },
  overallSummaryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  overallSummaryRow: {
    width: "30%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#D1D5DB",
    paddingBottom: 2,
  },
  overallSummaryLabel: {
    fontSize: 8,
    color: "#9CA3AF",
  },
  overallSummaryValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  bottomFlexContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  gradingScaleBox: {
    width: "55%",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#111827",
  },
  gradingScaleTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#22C55E",
    marginBottom: 4,
    textAlign: "center",
  },
  gradingScaleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gradingScaleItem: {
    width: "24%",
    fontSize: 7.5,
    color: "#FFFFFF",
    marginBottom: 2,
    textAlign: "center",
  },
  sealContainer: {
    width: "35%",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sealCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  sealText: {
    fontSize: 6,
    color: "#9CA3AF",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  signaturesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 15,
  },
  signatureBlock: {
    width: "30%",
    alignItems: "center",
  },
  signatureHeader: {
    fontSize: 8,
    color: "#9CA3AF",
    fontFamily: "Helvetica-Bold",
  },
  signatureSpace: {
    height: 45,
  },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
  },
  signatureRole: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    marginTop: 3,
    textAlign: "center",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    paddingTop: 6,
    alignItems: "center",
    marginTop: "auto",
  },
  footerText: {
    fontSize: 7,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 2,
  },
  footerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 4,
  },
  footerDate: {
    fontSize: 7,
    color: "#9CA3AF",
  },
  footerPage: {
    fontSize: 7,
    color: "#9CA3AF",
  },
});

export default function TranscriptTemplate({
  student,
  semesters,
  summary,
  logo,
  qrCode,
}: TranscriptProps) {
  // Defensive fallbacks to ensure document doesn't crash during rendering
  const studentId = student?.student_id || "";
  const name = student?.full_name || "";
  const rollNumber = student?.roll_no || "";
  const faculty = student?.faculty || "";
  const department = student?.department || "";
  const programme = student?.programme || "N/A";
  const batch = student?.batch || "N/A";
  const academicYear = student?.academic_year || "";
  const admissionDate = student?.admission_date || "N/A";
  const currentStatus = student?.current_status || "N/A";
  const transcriptDate =
    student?.transcript_date ??
    new Date().toISOString().split("T")[0];

  const semesterList = semesters || [];
  const totalSemesters = summary?.total_semesters || 0;
  const totalCourses = summary?.total_courses || 0;
  const totalCreditHours = summary?.total_credit_hours || 0;
  const overallCgpa = summary?.cgpa || 0;
  const academicStanding = summary?.academicStanding;
  const finalResult = summary?.finalResult;

  return (
    <Document title={`Official Transcript - ${name} (${studentId})`}>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image src={logo} style={styles.logo} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.uniName}>ABAARSO UNIVERSITY</Text>
            <Text style={styles.docTitle}>OFFICIAL ACADEMIC TRANSCRIPT</Text>
            <Text style={styles.facultyName}>
              {faculty || "Faculty of Engineering"}
            </Text>
          </View>
          <View style={styles.qrContainer}>
            <Image src={qrCode} style={styles.qrCode} />
            <Text style={styles.qrText}>Scan to Verify Transcript</Text>
          </View>
        </View>

        {/* Student Information Card */}
        <View style={styles.studentCard}>
          <View style={styles.cardRow}>
            <View style={styles.cardColumn}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Student Name:</Text>
                <Text style={styles.infoValue}>{name}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Student ID:</Text>
                <Text style={styles.infoValue}>{studentId}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Roll Number:</Text>
                <Text style={styles.infoValue}>{rollNumber}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Faculty:</Text>
                <Text style={styles.infoValue}>{faculty || "Faculty of Engineering"}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Department:</Text>
                <Text style={styles.infoValue}>{department}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Programme:</Text>
                <Text style={styles.infoValue}>{programme}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Batch:</Text>
                <Text style={styles.infoValue}>{batch}</Text>
              </View>
            </View>
            <View style={styles.cardColumn}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Academic Year:</Text>
                <Text style={styles.infoValue}>{academicYear}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Admission Date:</Text>
                <Text style={styles.infoValue}>{admissionDate}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Current Status:</Text>
                <Text style={styles.infoValue}>{currentStatus}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Transcript Date:</Text>
                <Text style={styles.infoValue}>{transcriptDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Semesters Section */}
        {semesterList.map((semester, semIndex) => (
          <View key={`${semester.semester_name}-${semIndex}`} style={styles.semesterSection} wrap={false}>
            <Text style={styles.semesterName}>{semester.semester_name}</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.colCode, styles.tableHeaderCell]}>
                  Course Code
                </Text>
                <Text style={[styles.colTitle, styles.tableHeaderCell]}>
                  Course Title
                </Text>
                <Text style={[styles.colCredit, styles.tableHeaderCell]}>
                  Credit Hours
                </Text>
                <Text style={[styles.colAttendance, styles.tableHeaderCell]}>
                  Attendance
                </Text>
                <Text style={[styles.colAssignment, styles.tableHeaderCell]}>
                  Assignment
                </Text>
                <Text style={[styles.colQuiz, styles.tableHeaderCell]}>
                  Quiz
                </Text>
                <Text style={[styles.colMidterm, styles.tableHeaderCell]}>
                  Midterm
                </Text>
                <Text style={[styles.colFinal, styles.tableHeaderCell]}>
                  Final
                </Text>
                <Text style={[styles.colTotal, styles.tableHeaderCell]}>
                  Total
                </Text>
                <Text style={[styles.colGrade, styles.tableHeaderCell]}>
                  Grade
                </Text>
                <Text style={[styles.colGpa, styles.tableHeaderCell]}>
                  GPA
                </Text>
              </View>
              {/* Table Body */}
              {(semester.courses || []).map((course, courseIndex) => (
                <View key={`${course.course_code}-${courseIndex}`} style={styles.tableRow}>
                  <Text style={styles.colCode}>{course.course_code}</Text>
                  <Text style={styles.colTitle}>{course.course_name}</Text>
                  <Text style={styles.colCredit}>{course.credit_hours}</Text>
                  <Text style={styles.colAttendance}>{course.attendance_mark}</Text>
                  <Text style={styles.colAssignment}>{course.assignment_mark}</Text>
                  <Text style={styles.colQuiz}>{course.quiz_mark}</Text>
                  <Text style={styles.colMidterm}>{course.midterm_mark}</Text>
                  <Text style={styles.colFinal}>{course.final_mark}</Text>
                  <Text style={styles.colTotal}>{course.total_marks}</Text>
                  <Text style={styles.colGrade}>{course.grade}</Text>
                  <Text style={styles.colGpa}>{Number(course.gpa).toFixed(2)}</Text>
                </View>
              ))}
            </View>

            {/* Semester Credit and GPA Breakdown */}
            <View style={styles.semesterFooterLine} />
            <View style={styles.semesterSummaryRow}>
              <Text style={styles.semesterSummaryLabel}>
                Total Credit Hours:{" "}
                <Text style={styles.semesterSummaryValue}>
                  {semester.total_credit_hours}
                </Text>
              </Text>
              <Text style={styles.semesterSummaryLabel}>
                Semester GPA:{" "}
                <Text style={styles.semesterSummaryValue}>
                  {Number(semester.semester_gpa).toFixed(2)}
                </Text>
              </Text>
            </View>
            <View style={styles.semesterFooterLine} />
          </View>
        ))}

        {/* Overall Academic Summary */}
        <View style={styles.overallSummaryCard} wrap={false}>
          <Text style={styles.overallSummaryTitle}>
            OVERALL ACADEMIC SUMMARY
          </Text>
          <View style={styles.overallSummaryContent}>
            <View style={styles.overallSummaryRow}>
              <Text style={styles.overallSummaryLabel}>Total Semesters:</Text>
              <Text style={styles.overallSummaryValue}>{totalSemesters}</Text>
            </View>
            <View style={styles.overallSummaryRow}>
              <Text style={styles.overallSummaryLabel}>Total Courses:</Text>
              <Text style={styles.overallSummaryValue}>{totalCourses}</Text>
            </View>
            <View style={styles.overallSummaryRow}>
              <Text style={styles.overallSummaryLabel}>Total Credit Hours:</Text>
              <Text style={styles.overallSummaryValue}>{totalCreditHours}</Text>
            </View>
            <View style={styles.overallSummaryRow}>
              <Text style={styles.overallSummaryLabel}>Overall CGPA:</Text>
              <Text style={styles.overallSummaryValue}>
                {Number(overallCgpa).toFixed(2)}
              </Text>
            </View>
            {academicStanding !== undefined && (
              <View style={styles.overallSummaryRow}>
                <Text style={styles.overallSummaryLabel}>Academic Standing:</Text>
                <Text style={styles.overallSummaryValue}>
                  {academicStanding}
                </Text>
              </View>
            )}
            {finalResult !== undefined && (
              <View style={styles.overallSummaryRow}>
                <Text style={styles.overallSummaryLabel}>Final Result:</Text>
                <Text style={styles.overallSummaryValue}>{finalResult}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Grading Scale & Seal Section */}
        <View style={styles.bottomFlexContainer} wrap={false}>
          <View style={styles.gradingScaleBox}>
            <Text style={styles.gradingScaleTitle}>GRADING SCALE</Text>
            <View style={styles.gradingScaleGrid}>
              <Text style={styles.gradingScaleItem}>A+ = 4.00</Text>
              <Text style={styles.gradingScaleItem}>A = 3.75</Text>
              <Text style={styles.gradingScaleItem}>B+ = 3.50</Text>
              <Text style={styles.gradingScaleItem}>B = 3.00</Text>
              <Text style={styles.gradingScaleItem}>C = 2.50</Text>
              <Text style={styles.gradingScaleItem}>D = 2.00</Text>
              <Text style={styles.gradingScaleItem}>F = 0.00</Text>
            </View>
          </View>

          <View style={styles.sealContainer}>
            <View style={styles.sealCircle}>
              <Text style={styles.sealText}>OFFICIAL</Text>
              <Text style={styles.sealText}>UNIVERSITY</Text>
              <Text style={styles.sealText}>SEAL</Text>
            </View>
          </View>
        </View>

        {/* Signature Blocks */}
        <View style={styles.signaturesContainer} wrap={false}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureHeader}>Prepared By</Text>
            <View style={styles.signatureSpace} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureRole}>Examinations Officer</Text>
          </View>

          <View style={styles.signatureBlock}>
            <Text style={styles.signatureHeader}>Verified By</Text>
            <View style={styles.signatureSpace} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureRole}>University Registrar</Text>
          </View>

          <View style={styles.signatureBlock}>
            <Text style={styles.signatureHeader}>Approved By</Text>
            <View style={styles.signatureSpace} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureRole}>Vice Chancellor</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            This transcript is generated electronically by the Abaarso University Result Management System.
          </Text>
          <Text style={styles.footerText}>
            This document becomes officially valid only after the university seal and authorized signatures have been applied.
          </Text>
          <View style={styles.footerBottom}>
            <Text style={styles.footerDate}>
              Generation Date: {transcriptDate}
            </Text>
            <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => (
              `Page ${pageNumber} of ${totalPages}`
            )} />
          </View>
        </View>
      </Page>
    </Document>
  );
}
