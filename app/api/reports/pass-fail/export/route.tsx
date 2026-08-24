import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
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
} from "@/lib/export-utils";

const CSV_HEADERS = [
  "Total Published Results",
  "Passed",
  "Failed",
  "Pass Percentage",
  "Fail Percentage",
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

    const rawFilters: Record<string, string | null> = {
      academic_id: searchParams.get("academic_id"),
      faculty_id: searchParams.get("faculty_id"),
      department_id: searchParams.get("department_id"),
      semester_id: searchParams.get("semester_id"),
      course_id: searchParams.get("course_id"),
    };

    const ids: Record<string, number> = {};
    for (const [key, value] of Object.entries(rawFilters)) {
      if (value === null) continue;
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) {
        return NextResponse.json(
          { success: false, message: `${key} must be a valid numeric ID` },
          { status: 400 }
        );
      }
      ids[key] = parsed;
    }

    const where: Prisma.ResultWhereInput = {
      status: ResultStatus.PUBLISHED,
      ...(ids.course_id ? { course_id: ids.course_id } : {}),
      ...(ids.semester_id ? { semester_id: ids.semester_id } : {}),
      ...(ids.department_id ? { course: { department_id: ids.department_id } } : {}),
      ...((ids.academic_id || ids.faculty_id) && {
        semester: {
          ...(ids.academic_id ? { academic_id: ids.academic_id } : {}),
          ...(ids.faculty_id ? { faculty_id: ids.faculty_id } : {}),
        },
      }),
    };

    const [total, failed] = await Promise.all([
      prisma.result.count({ where }),
      prisma.result.count({ where: { ...where, grade: "F" } }),
    ]);

    const passed = total - failed;
    const passPercentage = total > 0 ? Number(((passed / total) * 100).toFixed(2)) : 0;
    const failPercentage = total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0;

    const rows = [[total, passed, failed, passPercentage, failPercentage]];

    const filename = buildExportFilename("pass-fail-report", format);

    if (format === "xlsx") {
      const buf = buildXlsxBuffer(CSV_HEADERS, rows);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Export-Count": "1",
          "X-Export-Truncated": "false",
        },
      });
    }

    if (format === "pdf") {
      const logo = loadAtuLogo();
      const pdfBuffer = await renderToBuffer(
        <ReportTemplate
          title="Pass / Fail Report"
          subtitle="Published result pass and fail breakdown"
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
          "X-Export-Count": "1",
          "X-Export-Truncated": "false",
        },
      });
    }

    const csv = buildCsvString(CSV_HEADERS, rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Count": "1",
        "X-Export-Truncated": "false",
      },
    });
  } catch (error) {
    return prismaErrorResponse(error, "Failed to export pass/fail report");
  }
}
