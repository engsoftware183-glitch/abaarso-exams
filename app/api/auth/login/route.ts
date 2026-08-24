import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Real bcrypt hash of a fixed placeholder string. When the email does
// not exist we still run a bcrypt compare against it so the response
// time is indistinguishable from a real password check (no timing-based
// account enumeration).
const DUMMY_PASSWORD_HASH =
  "$2b$10$56T8.BvKoY3OVe4PNqiQvOfdwlHGyMnyGB0qI8DfhLo7hExPoZ/AK";


// ======================================================
// LOGIN USER
// ======================================================

export async function POST(
  req: NextRequest
) {
  try {

    // =========================================
    // GET REQUEST BODY
    // =========================================

    const body = await req.json();

    const {
      email,
      password,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Email and password are required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // FIND USER
    // =========================================

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    // =========================================
    // USER NOT FOUND
    // =========================================

    if (!user) {
      // Generic authentication failure - identical message/status to a
      // wrong password, plus a dummy bcrypt compare to equalize timing.
      // Never reveals whether the account exists. Nothing to lock or
      // count here: failed-attempt tracking lives on the User row only.
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);

      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid credentials",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================
    // ACCOUNT LOCKOUT CHECK
    // =========================================

    if (user.locked_until && user.locked_until.getTime() > Date.now()) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many failed attempts. Please try again later.",
        },
        {
          status: 423,
        }
      );
    }

    // =========================================
    // COMPARE PASSWORD
    // =========================================

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    // =========================================
    // INVALID PASSWORD
    // =========================================

    if (!passwordMatch) {
      // Expired lock (locked_until in the past) is implicitly cleared
      // below via the plain increment - no separate branch needed.
      const nextAttempts = (user.locked_until ? 0 : user.failed_login_attempts) + 1;
      const shouldLock = nextAttempts >= MAX_FAILED_ATTEMPTS;

      await prisma.user.update({
        where: { user_id: user.user_id },
        data: {
          failed_login_attempts: shouldLock ? 0 : nextAttempts,
          locked_until: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
        },
      });

      if (shouldLock) {
        return NextResponse.json(
          {
            success: false,
            message: "Too many failed attempts. Please try again later.",
          },
          {
            status: 423,
          }
        );
      }

      // Note: the previous recoveryAvailable hint is deliberately not
      // sent - it was only returned for accounts that exist, which would
      // have acted as an account-enumeration oracle. The generic
      // response is now identical for unknown email and wrong password.
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================
    // SUCCESSFUL PASSWORD MATCH - CLEAR COUNTERS
    // =========================================

    if (user.failed_login_attempts > 0 || user.locked_until) {
      await prisma.user.update({
        where: { user_id: user.user_id },
        data: { failed_login_attempts: 0, locked_until: null },
      });
    }

    // =========================================
    // JWT SECRET CHECK
    // =========================================

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        {
          success: false,

          message:
            "JWT_SECRET is missing in .env",
        },
        {
          status: 500,
        }
      );
    }

    // =========================================
    // GENERATE TOKEN
    // =========================================

    const token = jwt.sign(
      {
        id: user.user_id,

        user_id: user.user_id,

        username: user.username,

        email: user.email,

        role: user.role,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      }
    );

    // =========================================
    // SUCCESS RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Login successful",

        token,

        user: {
          user_id:
            user.user_id,

          username:
            user.username,

          email:
            user.email,

          role:
            user.role,

          created_at:
            user.created_at,
        },
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "LOGIN_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}