import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { compareResetCode, RESET_CODE_MAX_ATTEMPTS } from "@/lib/reset-code";
import { signResetToken } from "@/lib/reset-token";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

const INVALID_RESPONSE = { message: "Invalid or expired verification code." };
const ELIGIBLE_ROLES = ["ADMIN", "SUPER_ADMIN", "STUDENT"];


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json(INVALID_RESPONSE, { status: 400 });
    }

    // =========================================
    // RATE LIMITING
    // =========================================

    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`verify-reset-code:ip:${ip}`, 20, 15 * 60 * 1000);

    if (!ipLimit.allowed) {
      return NextResponse.json(INVALID_RESPONSE, { status: 429 });
    }

    // =========================================
    // LOOKUP ELIGIBLE USER + ACTIVE CODE
    // =========================================

    const user = await prisma.user.findUnique({
      where: { email },
      include: { student: true, admin: true },
    });

    if (!user || !ELIGIBLE_ROLES.includes(user.role)) {
      return NextResponse.json(INVALID_RESPONSE, { status: 400 });
    }

    if (
      (user.role === "STUDENT" && !user.student) ||
      (user.role === "ADMIN" && !user.admin)
    ) {
      return NextResponse.json(INVALID_RESPONSE, { status: 400 });
    }

    const resetCode = await prisma.passwordResetCode.findFirst({
      where: { user_id: user.user_id, used_at: null },
      orderBy: { created_at: "desc" },
    });

    if (!resetCode || resetCode.expires_at.getTime() < Date.now()) {
      return NextResponse.json(INVALID_RESPONSE, { status: 400 });
    }

    if (resetCode.verification_attempts >= RESET_CODE_MAX_ATTEMPTS) {
      return NextResponse.json(INVALID_RESPONSE, { status: 400 });
    }

    // =========================================
    // COMPARE CODE
    // =========================================

    const matches = await compareResetCode(code, resetCode.code_hash);

    if (!matches) {
      await prisma.passwordResetCode.update({
        where: { id: resetCode.id },
        data: { verification_attempts: { increment: 1 } },
      });

      return NextResponse.json(INVALID_RESPONSE, { status: 400 });
    }

    // =========================================
    // ISSUE SHORT-LIVED RESET GRANT (code stays unused/unmarked)
    // =========================================

    const resetToken = signResetToken(user.user_id, resetCode.id);

    return NextResponse.json({ verified: true, resetToken }, { status: 200 });
  } catch (error) {
    logError("VERIFY_RESET_CODE_ERROR", error);
    return NextResponse.json(INVALID_RESPONSE, { status: 400 });
  }
}
