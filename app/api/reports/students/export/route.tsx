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
  "Roll Number",
  "Full Name",
  "Gender",
  "Email",
  "Phone",
  "Address",
  "Academic Year",
  "Faculty",
  "Department",
  "Semester",
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
        { full_name: { contains: search, mode: "insensitive" } },
        { roll_no: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (academic_id) where.academic_id = parseInt(academic_id);
    if (faculty_id) where.faculty_id = parseInt(faculty_id);
    if (department_id) where.department_id = parseInt(department_id);
    if (semester_id) where.semester_id = parseInt(semester_id);

    const students = await prisma.student.findMany({
      where,
      take: EXPORT_MAX_ROWS,
      include: {
        academic: { select: { year: true } },
        faculty: { select: { faculty_name: true } },
        department: { select: { department_name: true } },
        semester: { select: { semester_name: true } },
      },
      orderBy: { full_name: "asc" },
    });

    const rows = students.map((s) => [
      s.roll_no,
      s.full_name,
      s.gender,
      s.email,
      s.phone ?? "",
      s.address ?? "",
      s.academic?.year ?? "",
      s.faculty?.faculty_name ?? "",
      s.department?.department_name ?? "",
      s.semester?.semester_name ?? "",
    ]);

    const filename = buildExportFilename("students-report", format);
    const truncated = students.length >= EXPORT_MAX_ROWS;

    if (format === "xlsx") {
      const buf = buildXlsxBuffer(CSV_HEADERS, rows);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Export-Count": String(students.length),
          "X-Export-Truncated": String(truncated),
        },
      });
    }

    if (format === "pdf") {
      const logo = loadAtuLogo();
      const pdfBuffer = await renderToBuffer(
        <ReportTemplate
          title="Student Report"
          subtitle="List of students with academic placement details"
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
          "X-Export-Count": String(students.length),
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
        "X-Export-Count": String(students.length),
        "X-Export-Truncated": String(truncated),
      },
    });
  } catch (error) {
    return prismaErrorResponse(error, "Failed to export students report");
  }
}
