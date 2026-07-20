import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";


// ======================================================
// REGISTER USER
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
      username,
      email,
      password,
      role,
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

    const user =
      await prisma.user.create({
        data: {
          username,
          email,

          password:
            hashedPassword,

          role:
            role || "STUDENT",
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

    console.log(
      "REGISTER_ERROR",
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