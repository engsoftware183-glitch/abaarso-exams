import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { verifyResetToken } from "@/lib/reset-token";
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

const FAILURE_RESPONSE = { message: "Unable to reset password. Please request a new code." };
const ELIGIBLE_ROLES = ["ADMIN", "SUPER_ADMIN", "STUDENT"];


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const resetToken = typeof body?.resetToken === "string" ? body.resetToken : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

    if (!resetToken || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "Reset token, new password, and confirmation are required." },
        { status: 400 }
      );
    }

    // =========================================
    // RATE LIMITING
    // =========================================

    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`reset-password:ip:${ip}`, 5, 15 * 60 * 1000);

    if (!ipLimit.allowed) {
      return NextResponse.json(FAILURE_RESPONSE, { status: 429 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });
    }

    if (!isPasswordValid(newPassword)) {
      return NextResponse.json({ message: PASSWORD_POLICY_MESSAGE }, { status: 400 });
    }

    // =========================================
    // VALIDATE RESET TOKEN
    // =========================================

    const payload = verifyResetToken(resetToken);

    if (!payload) {
      return NextResponse.json(FAILURE_RESPONSE, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { user_id: payload.user_id },
      include: { student: true, admin: true },
    });

    if (!user || !ELIGIBLE_ROLES.includes(user.role)) {
      return NextResponse.json(FAILURE_RESPONSE, { status: 400 });
    }

    if (
      (user.role === "STUDENT" && !user.student) ||
      (user.role === "ADMIN" && !user.admin)
    ) {
      return NextResponse.json(FAILURE_RESPONSE, { status: 400 });
    }

    const resetCode = await prisma.passwordResetCode.findUnique({ where: { id: payload.code_id } });

    if (
      !resetCode ||
      resetCode.user_id !== user.user_id ||
      resetCode.used_at !== null ||
      resetCode.expires_at.getTime() < Date.now()
    ) {
      return NextResponse.json(FAILURE_RESPONSE, { status: 400 });
    }

    // =========================================
    // ATOMIC UPDATE
    // =========================================

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { user_id: user.user_id },
        data: {
          password: hashedPassword,
          failed_login_attempts: 0,
          locked_until: null,
        },
      }),
      prisma.passwordResetCode.update({
        where: { id: resetCode.id },
        data: { used_at: new Date() },
      }),
      // Invalidate any other still-active codes for this user.
      prisma.passwordResetCode.updateMany({
        where: { user_id: user.user_id, used_at: null, id: { not: resetCode.id } },
        data: { used_at: new Date() },
      }),
    ]);

    return NextResponse.json(
      { message: "Password reset successfully. Please sign in with your new password." },
      { status: 200 }
    );
  } catch (error) {
    logError("RESET_PASSWORD_ERROR", error);
    return NextResponse.json(FAILURE_RESPONSE, { status: 500 });
  }
}
