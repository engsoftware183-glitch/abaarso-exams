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

    const skip = (page - 1) * limit;

    const [total, attendances] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: { 
            select: { full_name: true, roll_no: true } 
          },
          course: { 
            select: { course_name: true, course_code: true } 
          },
        },
        orderBy: { attendance_id: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: attendances,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    return prismaErrorResponse(error, "Failed to fetch attendance report");
  }
}
