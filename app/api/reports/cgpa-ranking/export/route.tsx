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
  EXPORT_MAX_ROWS,
} from "@/lib/export-utils";

const CSV_HEADERS = [
  "Rank",
  "Roll Number",
  "Full Name",
  "Faculty",
  "Department",
  "Total Credit Hours",
  "CGPA",
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

    const where: Prisma.StudentWhereInput = {
      ...(ids.academic_id ? { academic_id: ids.academic_id } : {}),
      ...(ids.faculty_id ? { faculty_id: ids.faculty_id } : {}),
      ...(ids.department_id ? { department_id: ids.department_id } : {}),
      ...(ids.semester_id ? { semester_id: ids.semester_id } : {}),
    };

    const students = await prisma.student.findMany({
      where,
      select: {
        student_id: true,
        roll_no: true,
        full_name: true,
        faculty: { select: { faculty_id: true, faculty_name: true } },
        department: { select: { department_id: true, department_name: true } },
      },
    });

    const studentIds = students.map((s) => s.student_id);

    const results = await prisma.result.findMany({
      where: { status: ResultStatus.PUBLISHED, student_id: { in: studentIds } },
      select: {
        student_id: true,
        gpa: true,
        course: { select: { credit_hours: true } },
      },
    });

    const totals = new Map<number, { sumGpaCredits: number; totalCreditHours: number }>();
    for (const result of results) {
      const entry = totals.get(result.student_id) ?? { sumGpaCredits: 0, totalCreditHours: 0 };
      entry.sumGpaCredits += result.gpa * result.course.credit_hours;
      entry.totalCreditHours += result.course.credit_hours;
      totals.set(result.student_id, entry);
    }

    const ranked = students
      .map((s) => {
        const entry = totals.get(s.student_id);
        const totalCreditHours = entry?.totalCreditHours ?? 0;
        const cgpa = totalCreditHours > 0 ? Number((entry!.sumGpaCredits / totalCreditHours).toFixed(2)) : 0;

        return {
          student_id: s.student_id,
          roll_no: s.roll_no,
          full_name: s.full_name,
          faculty_name: s.faculty?.faculty_name ?? "",
          department_name: s.department?.department_name ?? "",
          total_credit_hours: totalCreditHours,
          cgpa,
        };
      })
      .sort((a, b) => {
        if (b.cgpa !== a.cgpa) return b.cgpa - a.cgpa;
        if (b.total_credit_hours !== a.total_credit_hours) return b.total_credit_hours - a.total_credit_hours;
        const nameCompare = a.full_name.localeCompare(b.full_name);
        if (nameCompare !== 0) return nameCompare;
        return a.student_id - b.student_id;
      })
      .map((row, index) => ({ rank: index + 1, ...row }));

    const limited = ranked.slice(0, EXPORT_MAX_ROWS);

    const rows = limited.map((row) => [
      row.rank,
      row.roll_no,
      row.full_name,
      row.faculty_name,
      row.department_name,
      row.total_credit_hours,
      row.cgpa,
    ]);

    const filename = buildExportFilename("cgpa-ranking-report", format);
    const truncated = ranked.length >= EXPORT_MAX_ROWS;

    if (format === "xlsx") {
      const buf = buildXlsxBuffer(CSV_HEADERS, rows);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Export-Count": String(limited.length),
          "X-Export-Truncated": String(truncated),
        },
      });
    }

    if (format === "pdf") {
      const logo = loadAtuLogo();
      const pdfBuffer = await renderToBuffer(
        <ReportTemplate
          title="CGPA Ranking Report"
          subtitle="Student CGPA ranking based on published results"
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
          "X-Export-Count": String(limited.length),
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
        "X-Export-Count": String(limited.length),
        "X-Export-Truncated": String(truncated),
      },
    });
  } catch (error) {
    return prismaErrorResponse(error, "Failed to export CGPA ranking report");
  }
}
