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

    const skip = (page - 1) * limit;

    const [total, courses] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { 
            select: { 
              department_name: true,
              faculty: { select: { faculty_name: true } }
            } 
          },
          semester: { 
            select: { 
              semester_name: true,
              academic: { select: { year: true } }
            } 
          },
        },
        orderBy: { course_name: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: courses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    return prismaErrorResponse(error, "Failed to fetch course report");
  }
}
