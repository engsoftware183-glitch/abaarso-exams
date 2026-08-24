import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { ResultStatus } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import ReportTemplate from "@/pdf/report.template";
import {
  buildCsvString,
  buildXlsxBuffer,
  buildExportFilename,
  loadAtuLogo,
  EXPORT_MAX_ROWS,
} from "@/lib/export-utils";

const CSV_HEADERS = [
  "Semester Name",
  "Academic Year",
  "Faculty Name",
  "Student Count",
  "Course Count",
  "Published Results",
  "Average GPA",
  "Pass Count",
  "Fail Count",
];

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format")?.toLowerCase() === "xlsx"
      ? "xlsx"
      : searchParams.get("format")?.toLowerCase() === "pdf"
        ? "pdf"
        : "csv";

    const academicIdParam = searchParams.get("academic_id");
    const facultyIdParam = searchParams.get("faculty_id");
    const semesterIdParam = searchParams.get("semester_id");

    const academic_id = academicIdParam && Number.isInteger(Number(academicIdParam)) ? Number(academicIdParam) : undefined;
    const faculty_id = facultyIdParam && Number.isInteger(Number(facultyIdParam)) ? Number(facultyIdParam) : undefined;
    const semester_id = semesterIdParam && Number.isInteger(Number(semesterIdParam)) ? Number(semesterIdParam) : undefined;

    const where = {
      ...(academic_id ? { academic_id } : {}),
      ...(faculty_id ? { faculty_id } : {}),
      ...(semester_id ? { semester_id } : {}),
    };

    const semesters = await prisma.semester.findMany({
      where,
      take: EXPORT_MAX_ROWS,
      select: {
        semester_id: true,
        semester_name: true,
        academic: { select: { academic_id: true, year: true } },
        faculty: { select: { faculty_id: true, faculty_name: true } },
        _count: { select: { students: true, courses: true } },
      },
      orderBy: { semester_id: "desc" },
    });

    const semesterIds = semesters.map((s) => s.semester_id);

    const [resultCounts, resultGrades] = semesterIds.length
      ? await Promise.all([
          prisma.result.groupBy({
            by: ["semester_id"],
            where: { status: ResultStatus.PUBLISHED, semester_id: { in: semesterIds } },
            _count: { _all: true },
            _avg: { gpa: true },
          }),
          prisma.result.groupBy({
            by: ["semester_id", "grade"],
            where: { status: ResultStatus.PUBLISHED, semester_id: { in: semesterIds } },
            _count: { _all: true },
          }),
        ])
      : [[], []];

    const countBySemester = new Map(resultCounts.map((r) => [r.semester_id, r]));

    const passFailBySemester = new Map<number, { pass: number; fail: number }>();
    for (const row of resultGrades) {
      const stats = passFailBySemester.get(row.semester_id) ?? { pass: 0, fail: 0 };
      if (row.grade === "F") {
        stats.fail += row._count._all;
      } else {
        stats.pass += row._count._all;
      }
      passFailBySemester.set(row.semester_id, stats);
    }

    const rows = semesters.map((s) => {
      const countRow = countBySemester.get(s.semester_id);
      const publishedCount = countRow?._count._all ?? 0;
      const averageGpa = publishedCount > 0 ? Number((countRow?._avg.gpa ?? 0).toFixed(2)) : 0;
      const passFail = passFailBySemester.get(s.semester_id);

      return [
        s.semester_name,
        s.academic?.year ?? "",
        s.faculty?.faculty_name ?? "",
        s._count.students,
        s._count.courses,
        publishedCount,
        averageGpa,
        passFail?.pass ?? 0,
        passFail?.fail ?? 0,
      ];
    });

    const filename = buildExportFilename("semesters-report", format);
    const truncated = semesters.length >= EXPORT_MAX_ROWS;

    if (format === "xlsx") {
      const buf = buildXlsxBuffer(CSV_HEADERS, rows);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Export-Count": String(semesters.length),
          "X-Export-Truncated": String(truncated),
        },
      });
    }

    if (format === "pdf") {
      const logo = loadAtuLogo();
      const pdfBuffer = await renderToBuffer(
        <ReportTemplate
          title="Semester Report"
          subtitle="Semester-level performance metrics"
          headers={CSV_HEADERS}
          rows={rows}
          logo={logo}
        />
      );
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Export-Count": String(semesters.length),
          "X-Export-Truncated": String(truncated),
        },
      });
    }

    const csv = buildCsvString(CSV_HEADERS, rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Count": String(semesters.length),
        "X-Export-Truncated": String(truncated),
      },
    });
  } catch (error) {
    return prismaErrorResponse(error, "Failed to export semesters report");
  }
}
