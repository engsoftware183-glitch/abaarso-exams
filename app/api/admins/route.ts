import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy";
import { logActivity } from "@/lib/activity-log";

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
      user_id,
      username,
      email,
      password,
    } = body;

    // =========================================
    // MODE: PROMOTE AN EXISTING USER
    // =========================================
    //
    // Selecting an existing user from the database-backed combobox
    // submits only `user_id` - no credentials are ever typed manually
    // for a user that already exists.

    const isPromotion =
      user_id !== undefined &&
      user_id !== null &&
      user_id !== "";

    if (isPromotion) {
      return promoteExistingUser(Number(user_id), auth.decoded.user_id);
    }

    // =========================================
    // MODE: CREATE A NEW ADMIN ACCOUNT
    // =========================================

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

    void logActivity("CREATE_ADMIN", `Created admin account for ${username}`);

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


// ======================================================
// PROMOTE AN EXISTING USER TO ADMIN
// ======================================================
//
// Used when the SUPER_ADMIN selects an existing user from the
// database-backed combobox instead of typing new credentials.
// Only `user_id` is trusted from the request - role is always
// assigned server-side, never sent by the client.

async function promoteExistingUser(
  targetUserId: number,
  currentUserId: number
): Promise<NextResponse> {
  try {

    if (
      !Number.isInteger(targetUserId) ||
      targetUserId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid user is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // PREVENT SELF-PROMOTION
    // =========================================

    if (targetUserId === currentUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot promote your own account",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // TARGET USER MUST EXIST
    // =========================================

    const targetUser =
      await prisma.user.findUnique({
        where: {
          user_id: targetUserId,
        },
        include: {
          admin: true,
        },
      });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "This user is already a Super Admin",
        },
        {
          status: 409,
        }
      );
    }

    // =========================================
    // PREVENT DUPLICATE ADMIN RELATION
    // =========================================

    if (targetUser.admin) {
      return NextResponse.json(
        {
          success: false,
          message: "This user is already an administrator",
        },
        {
          status: 409,
        }
      );
    }

    // =========================================
    // PROMOTE (ATOMIC)
    // =========================================
    //
    // Role is always set to "ADMIN" here - never taken from the
    // request body - so this endpoint can never be used to mint a
    // SUPER_ADMIN.

    const admin = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          user_id: targetUserId,
        },
        data: {
          role: "ADMIN",
        },
      });

      return tx.admin.create({
        data: {
          user_id: targetUserId,
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

    void logActivity("PROMOTE_ADMIN", `Promoted user ${admin.user.username} to administrator`);

    return NextResponse.json(
      {
        success: true,

        message:
          "User promoted to administrator successfully",

        admin,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "PROMOTE_ADMIN_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to promote user to admin");
  }
}
