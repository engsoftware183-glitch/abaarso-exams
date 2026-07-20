import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


// ======================================================
// GET ALL ADMINS
// ======================================================

export async function GET(req: NextRequest) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================
    // SUPER ADMIN ONLY
    // =========================================

    if (decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

    // =========================================
    // GET ADMINS
    // =========================================

    const admins = await prisma.admin.findMany({

      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            role: true,
            created_at: true,
            updated_at: true,
          },
        },
      },

      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        count: admins.length,
        admins,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_ADMINS_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch admins",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// CREATE ADMIN
// ======================================================

export async function POST(req: NextRequest) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================
    // SUPER ADMIN ONLY
    // =========================================

    if (decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

    // =========================================
    // REQUEST BODY
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
    // EXISTING USER CHECK
    // =========================================

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email already exists",
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
      await bcrypt.hash(password, 10);

    // =========================================
    // CREATE USER
    // =========================================

    const user =
      await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: role || "ADMIN",
        },
      });

    // =========================================
    // CREATE ADMIN
    // =========================================

    const admin =
      await prisma.admin.create({

        data: {
          user_id: user.user_id,
        },

        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
              role: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Admin created successfully",

        admin,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "CREATE_ADMIN_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to create admin",
      },
      {
        status: 500,
      }
    );
  }
}