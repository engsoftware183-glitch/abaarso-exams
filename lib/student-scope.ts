import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth, type JwtPayload } from "@/lib/auth";

// ======================================================
// STUDENT DATA SCOPE
// ======================================================
//
// Wraps requireAuth for routes that SUPER_ADMIN/ADMIN can browse
// without restriction but STUDENT may only see their own records.
//
// The resolved student is looked up from the verified JWT's user_id
// (never from a client-supplied student_id/roll_no), so it is always
// the caller's own record. Callers must filter every query by it when
// non-null - null means "no restriction" (SUPER_ADMIN/ADMIN).

export type StudentScopeContext = {
  student_id: number;
  academic_id: number;
  faculty_id: number;
  department_id: number;
  semester_id: number;
};

export type StudentScopeResult =
  | { ok: true; decoded: JwtPayload; student: StudentScopeContext | null }
  | { ok: false; response: NextResponse };

export async function requireStudentScope(
  req: NextRequest,
  allowedRoles?: string[]
): Promise<StudentScopeResult> {
  const auth = requireAuth(req, allowedRoles);

  if (!auth.ok) {
    return auth;
  }

  if (auth.decoded.role !== "STUDENT") {
    return {
      ok: true,
      decoded: auth.decoded,
      student: null,
    };
  }

  const student = await prisma.student.findUnique({
    where: {
      user_id: Number(auth.decoded.user_id),
    },
    select: {
      student_id: true,
      academic_id: true,
      faculty_id: true,
      department_id: true,
      semester_id: true,
    },
  });

  // A STUDENT-role token with no linked Student profile can't be
  // scoped to anything - deny rather than fall back to "no restriction".
  if (!student) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    ok: true,
    decoded: auth.decoded,
    student,
  };
}

// ======================================================
// EXAM SCOPE
// ======================================================
//
// Exam has no student_id - a student's own exams are the ones for
// their own academic year/faculty/semester whose course belongs to
// their own department (same relationship used to filter a
// student's courses elsewhere in the API).

export function examScopeWhere(student: StudentScopeContext | null) {
  if (!student) {
    return undefined;
  }

  return {
    academic_id: student.academic_id,
    faculty_id: student.faculty_id,
    semester_id: student.semester_id,
    course: {
      department_id: student.department_id,
    },
  };
}
