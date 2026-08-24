import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
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
  "Course Name",
  "Course Code",
  "Credit Hours",
  "Description",
  "Department",
  "Faculty",
  "Semester",
  "Academic Year",
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

    const search = searchParams.get("search") || "";
    const academic_id = searchParams.get("academic_id");
    const faculty_id = searchParams.get("faculty_id");
    const department_id = searchParams.get("department_id");
    const semester_id = searchParams.get("semester_id");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { course_name: { contains: search, mode: "insensitive" } },
        { course_code: { contains: search, mode: "insensitive" } },
      ];
    }

    if (department_id) where.department_id = parseInt(department_id);
    if (semester_id) where.semester_id = parseInt(semester_id);

    if (academic_id || faculty_id) {
      where.semester = {
        ...(academic_id && { academic_id: parseInt(academic_id) }),
        ...(faculty_id && { faculty_id: parseInt(faculty_id) }),
      };
    }

    const courses = await prisma.course.findMany({
      where,
      take: EXPORT_MAX_ROWS,
      include: {
        department: {
          select: {
            department_name: true,
            faculty: { select: { faculty_name: true } },
          },
        },
        semester: {
          select: {
            semester_name: true,
            academic: { select: { year: true } },
          },
        },
      },
      orderBy: { course_name: "asc" },
    });

    const rows = courses.map((c) => [
      c.course_name,
      c.course_code,
      c.credit_hours,
      c.description ?? "",
      c.department?.department_name ?? "",
      c.department?.faculty?.faculty_name ?? "",
      c.semester?.semester_name ?? "",
      c.semester?.academic?.year ?? "",
    ]);

    const filename = buildExportFilename("courses-report", format);
    const truncated = courses.length >= EXPORT_MAX_ROWS;

    if (format === "xlsx") {
      const buf = buildXlsxBuffer(CSV_HEADERS, rows);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Export-Count": String(courses.length),
          "X-Export-Truncated": String(truncated),
        },
      });
    }

    if (format === "pdf") {
      const logo = loadAtuLogo();
      const pdfBuffer = await renderToBuffer(
        <ReportTemplate
          title="Course Report"
          subtitle="List of courses with department and semester details"
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
          "X-Export-Count": String(courses.length),
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
        "X-Export-Count": String(courses.length),
        "X-Export-Truncated": String(truncated),
      },
    });
  } catch (error) {
    return prismaErrorResponse(error, "Failed to export courses report");
  }
}
