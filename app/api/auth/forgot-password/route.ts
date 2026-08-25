import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generateResetCode, hashResetCode, RESET_CODE_TTL_MS } from "@/lib/reset-code";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

const GENERIC_RESPONSE = {
  message: "If this account is eligible, a verification code has been sent.",
};

const ELIGIBLE_ROLES = ["ADMIN", "SUPER_ADMIN", "STUDENT"];


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      // Still a generic shape - do not hint at what was wrong.
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    // =========================================
    // RATE LIMITING (per email + per IP)
    // =========================================

    const ip = getClientIp(req);
    const emailLimit = checkRateLimit(`forgot-password:email:${email}`, 3, 15 * 60 * 1000);
    const ipLimit = checkRateLimit(`forgot-password:ip:${ip}`, 10, 15 * 60 * 1000);

    if (!emailLimit.allowed || !ipLimit.allowed) {
      // Same generic response even when rate-limited, to avoid leaking signal.
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    // =========================================
    // LOOKUP + ELIGIBILITY (never revealed to caller)
    // =========================================

    const user = await prisma.user.findUnique({
      where: { email },
      include: { student: true, admin: true },
    });

    if (user && ELIGIBLE_ROLES.includes(user.role)) {
      if (
        (user.role === "STUDENT" && !user.student) ||
        (user.role === "ADMIN" && !user.admin)
      ) {
        // skip silently for accounts in an inconsistent state
      } else {
        const code = generateResetCode();
        const codeHash = await hashResetCode(code);

        await prisma.$transaction([
          prisma.passwordResetCode.updateMany({
            where: { user_id: user.user_id, used_at: null },
            data: { used_at: new Date() },
          }),
          prisma.passwordResetCode.create({
            data: {
              user_id: user.user_id,
              code_hash: codeHash,
              expires_at: new Date(Date.now() + RESET_CODE_TTL_MS),
            },
          }),
        ]);

        await sendPasswordResetEmail(user.email, code).catch((error) => {
          logError("PASSWORD_RESET_EMAIL_ERROR", error);
        });
      }
    }

    // Identical response and status regardless of eligibility.
    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  } catch (error) {
    logError("FORGOT_PASSWORD_ERROR", error);
    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  }
}
