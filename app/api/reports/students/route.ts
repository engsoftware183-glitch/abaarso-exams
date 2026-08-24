import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));
    
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

    const skip = (page - 1) * limit;

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          academic: { select: { year: true } },
          faculty: { select: { faculty_name: true } },
          department: { select: { department_name: true } },
          semester: { select: { semester_name: true } },
        },
        orderBy: { full_name: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    return prismaErrorResponse(error, "Failed to fetch student report");
  }
}
