import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";


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
      return NextResponse.json(
        {
          success: false,

          message:
            "User not found",
        },
        {
          status: 404,
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