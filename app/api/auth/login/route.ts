import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/cookies";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const DUMMY_PASSWORD_HASH =
  "$2b$10$56T8.BvKoY3OVe4PNqiQvOfdwlHGyMnyGB0qI8DfhLo7hExPoZ/AK";


export async function POST(
  req: NextRequest
) {
  try {

    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`login:ip:${ip}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many attempts. Please try again later.",
        },
        {
          status: 429,
        }
      );
    }

    const body = await req.json();

    const {
      email,
      password,
    } = body;

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

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
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

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
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

    if (user.failed_login_attempts > 0 || user.locked_until) {
      await prisma.user.update({
        where: { user_id: user.user_id },
        data: { failed_login_attempts: 0, locked_until: null },
      });
    }

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

    const response = NextResponse.json(
      {
        success: true,

        message:
          "Login successful",

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

    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    return response;

  } catch (error) {

    logError("LOGIN_ERROR", error);

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