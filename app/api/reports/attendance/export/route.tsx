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
  "Student Name",
  "Roll No",
  "Course Name",
  "Course Code",
  "Attendance Mark",
  "Attendance Percent",
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
    const student_id = searchParams.get("student_id");
    const course_id = searchParams.get("course_id");
    const academic_id = searchParams.get("academic_id");
    const faculty_id = searchParams.get("faculty_id");
    const department_id = searchParams.get("department_id");
    const semester_id = searchParams.get("semester_id");

    const where: Record<string, unknown> = {};

    if (student_id) where.student_id = parseInt(student_id);
    if (course_id) where.course_id = parseInt(course_id);

    if (search || academic_id || faculty_id || department_id || semester_id) {
      where.student = {
        ...(search && {
          OR: [
            { full_name: { contains: search, mode: "insensitive" } },
            { roll_no: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(academic_id && { academic_id: parseInt(academic_id) }),
        ...(faculty_id && { faculty_id: parseInt(faculty_id) }),
        ...(department_id && { department_id: parseInt(department_id) }),
        ...(semester_id && { semester_id: parseInt(semester_id) }),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      take: EXPORT_MAX_ROWS,
      include: {
        student: { select: { full_name: true, roll_no: true } },
        course: { select: { course_name: true, course_code: true } },
      },
      orderBy: { attendance_id: "desc" },
    });

    const rows = attendances.map((a) => [
      a.student?.full_name ?? "",
      a.student?.roll_no ?? "",
      a.course?.course_name ?? "",
      a.course?.course_code ?? "",
      a.attendance_mark,
      a.attendance_percent,
    ]);

    const filename = buildExportFilename("attendance-report", format);
    const truncated = attendances.length >= EXPORT_MAX_ROWS;

    if (format === "xlsx") {
      const buf = buildXlsxBuffer(CSV_HEADERS, rows);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Export-Count": String(attendances.length),
          "X-Export-Truncated": String(truncated),
        },
      });
    }

    if (format === "pdf") {
      const logo = loadAtuLogo();
      const pdfBuffer = await renderToBuffer(
        <ReportTemplate
          title="Attendance Report"
          subtitle="Student attendance marks and percentages per course"
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
          "X-Export-Count": String(attendances.length),
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
        "X-Export-Count": String(attendances.length),
        "X-Export-Truncated": String(truncated),
      },
    });
  } catch (error) {
    return prismaErrorResponse(error, "Failed to export attendance report");
  }
}
