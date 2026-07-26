import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


// ======================================================
// GET ALL ADMINS
// ======================================================

export async function GET(req: NextRequest) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN"]);

    if (!auth.ok) {
      return auth.response;
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

    return prismaErrorResponse(error, "Failed to fetch admins");
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

    const auth = requireAuth(req, ["SUPER_ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // REQUEST BODY
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
    // CREATE USER + ADMIN (ATOMIC)
    // =========================================
    //
    // This endpoint's sole purpose is creating admins, so role is
    // always "ADMIN" - never client-controlled (prevents creating a
    // SUPER_ADMIN or STUDENT through the admin-creation endpoint).
    // User + Admin are created in a single transaction so a failure
    // partway through never leaves an orphaned User row.

    const admin =
      await prisma.$transaction(async (tx) => {
        const user =
          await tx.user.create({
            data: {
              username,
              email,
              password: hashedPassword,
              role: "ADMIN",
            },
          });

        return tx.admin.create({

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

    return prismaErrorResponse(error, "Failed to create admin");
  }
}