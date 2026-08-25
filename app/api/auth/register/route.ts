import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { prismaErrorResponse } from "@/lib/errors";
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";


// ======================================================
// REGISTER USER
// ======================================================

export async function POST(
  req: NextRequest
) {
  try {

    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many registration attempts. Please try again later.",
        },
        {
          status: 429,
        }
      );
    }

    // =========================================
    // GET REQUEST BODY
    // =========================================

    const body = await req.json();

    const {
      username,
      email,
      password,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !username ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All fields are required",
        },
        {
          status: 400,
        }
      );
    }

    if (!isPasswordValid(password)) {
      return NextResponse.json(
        {
          success: false,
          message: PASSWORD_POLICY_MESSAGE,
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // CHECK EXISTING USER
    // =========================================




// =========================================
// CHECK EXISTING USER
// =========================================

const existingUser =
  await prisma.user.findFirst({
    where: {
      OR: [
        {
          email,
        },
        {
          username,
        },
      ],
    },
  });

if (existingUser) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Email or Username already exists",
    },
    {
      status: 409,
    }
  );
}










    // =========================================
    // HASH PASSWORD
    // =========================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // =========================================
    // CREATE USER
    // =========================================

    // Public self-registration must never allow the caller to choose
    // their own role (ADMIN/SUPER_ADMIN) - always STUDENT.
    const user =
      await prisma.user.create({
        data: {
          username,
          email,

          password:
            hashedPassword,

          role: "STUDENT",
        },
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "User registered successfully",

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
        status: 201,
      }
    );

  } catch (error) {

    logError("REGISTER_ERROR", error);

    return prismaErrorResponse(error, "Internal Server Error");
  }
}