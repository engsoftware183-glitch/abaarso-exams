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
  "Department Name",
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

    const facultyIdParam = searchParams.get("faculty_id");
    const departmentIdParam = searchParams.get("department_id");

    const faculty_id = facultyIdParam && Number.isInteger(Number(facultyIdParam)) ? Number(facultyIdParam) : undefined;
    const department_id = departmentIdParam && Number.isInteger(Number(departmentIdParam)) ? Number(departmentIdParam) : undefined;

    const where = {
      ...(faculty_id ? { faculty_id } : {}),
      ...(department_id ? { department_id } : {}),
    };

    const departments = await prisma.department.findMany({
      where,
      take: EXPORT_MAX_ROWS,
      select: {
        department_id: true,
        department_name: true,
        faculty: { select: { faculty_id: true, faculty_name: true } },
        _count: { select: { students: true, courses: true } },
      },
      orderBy: { department_name: "asc" },
    });

    const departmentIds = departments.map((d) => d.department_id);

    const courses = await prisma.course.findMany({
      where: { department_id: { in: departmentIds } },
      select: { course_id: true, department_id: true },
    });
    const courseToDepartment = new Map(courses.map((c) => [c.course_id, c.department_id]));
    const courseIds = courses.map((c) => c.course_id);

    const [resultCounts, resultGrades] = courseIds.length
      ? await Promise.all([
          prisma.result.groupBy({
            by: ["course_id"],
            where: { status: ResultStatus.PUBLISHED, course_id: { in: courseIds } },
            _count: { _all: true },
            _avg: { gpa: true },
          }),
          prisma.result.groupBy({
            by: ["course_id", "grade"],
            where: { status: ResultStatus.PUBLISHED, course_id: { in: courseIds } },
            _count: { _all: true },
          }),
        ])
      : [[], []];

    const departmentStats = new Map<
      number,
      { publishedCount: number; sumGpaWeighted: number; passCount: number; failCount: number }
    >();

    for (const row of resultCounts) {
      const did = courseToDepartment.get(row.course_id);
      if (did === undefined) continue;
      const stats = departmentStats.get(did) ?? { publishedCount: 0, sumGpaWeighted: 0, passCount: 0, failCount: 0 };
      stats.publishedCount += row._count._all;
      stats.sumGpaWeighted += (row._avg.gpa ?? 0) * row._count._all;
      departmentStats.set(did, stats);
    }

    for (const row of resultGrades) {
      const did = courseToDepartment.get(row.course_id);
      if (did === undefined) continue;
      const stats = departmentStats.get(did) ?? { publishedCount: 0, sumGpaWeighted: 0, passCount: 0, failCount: 0 };
      if (row.grade === "F") {
        stats.failCount += row._count._all;
      } else {
        stats.passCount += row._count._all;
      }
      departmentStats.set(did, stats);
    }

    const rows = departments.map((d) => {
      const stats = departmentStats.get(d.department_id);
      const publishedCount = stats?.publishedCount ?? 0;
      const averageGpa = publishedCount > 0 ? Number(((stats?.sumGpaWeighted ?? 0) / publishedCount).toFixed(2)) : 0;

      return [
        d.department_name,
        d.faculty?.faculty_name ?? "",
        d._count.students,
        d._count.courses,
        publishedCount,
        averageGpa,
        stats?.passCount ?? 0,
        stats?.failCount ?? 0,
      ];
    });

    const filename = buildExportFilename("departments-report", format);
    const truncated = departments.length >= EXPORT_MAX_ROWS;

    if (format === "xlsx") {
      const buf = buildXlsxBuffer(CSV_HEADERS, rows);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Export-Count": String(departments.length),
          "X-Export-Truncated": String(truncated),
        },
      });
    }

    if (format === "pdf") {
      const logo = loadAtuLogo();
      const pdfBuffer = await renderToBuffer(
        <ReportTemplate
          title="Department Report"
          subtitle="Department-level performance metrics"
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
          "X-Export-Count": String(departments.length),
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
        "X-Export-Count": String(departments.length),
        "X-Export-Truncated": String(truncated),
      },
    });
  } catch (error) {
    return prismaErrorResponse(error, "Failed to export departments report");
  }
}
