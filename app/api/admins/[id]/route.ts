import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";

// ======================================================
// GET ONE ADMIN
// ======================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;

    // =========================================
    // AUTHORIZATION
    // =========================================
    //
    // Administrator records (username/email/role) are sensitive
    // account data - only SUPER_ADMIN may read them. Previously this
    // route accepted any authenticated role, allowing e.g. a STUDENT
    // to fetch another user's admin profile.

    const auth = requireAuth(req, ["SUPER_ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // GET ADMIN
    // =========================================

    const admin =
      await prisma.admin.findUnique({
        where: {
          admin_id: Number(id),
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

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        admin,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "GET_ADMIN_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to fetch admin");
  }
}


// ======================================================
// UPDATE ADMIN
// ======================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // FIND ADMIN
    // =========================================

    const existingAdmin =
      await prisma.admin.findUnique({
        where: {
          admin_id: Number(id),
        },

        include: {
          user: true,
        },
      });

    if (!existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found",
        },
        {
          status: 404,
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
    // ROLE IS NEVER CLIENT-CONTROLLED
    // =========================================
    //
    // This endpoint only supports editing an administrator's
    // username/email/password - it never trusts a client-supplied
    // role. Administrator management (Task 1) has no legitimate need
    // to change role through this route: accounts reach this table
    // already as "ADMIN" (via creation or promotion), and SUPER_ADMIN
    // is a controlled bootstrap/privileged role that must never be
    // reachable through normal administrator CRUD. If a caller sends
    // a `role` that would actually change the account's current role,
    // the request is rejected outright rather than silently ignored,
    // so a client can never escalate (or demote) privileges this way.

    if (
      role !== undefined &&
      role !== null &&
      role !== "" &&
      role !== existingAdmin.user.role
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Role cannot be changed through this endpoint",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // HASH PASSWORD
    // =========================================

    let hashedPassword =
      existingAdmin.user.password;

    if (password) {
      hashedPassword =
        await bcrypt.hash(password, 10);
    }

    // =========================================
    // UPDATE USER
    // =========================================
    //
    // role is intentionally omitted from `data` below - it is always
    // left exactly as it currently is in the database, never taken
    // from the request body.

    const updatedUser =
      await prisma.user.update({
        where: {
          user_id:
            existingAdmin.user_id,
        },

        data: {
          username:
            username ||
            existingAdmin.user.username,

          email:
            email ||
            existingAdmin.user.email,

          password: hashedPassword,
        },

        select: {
          user_id: true,
          username: true,
          email: true,
          role: true,
          created_at: true,
          updated_at: true,
        },
      });

    void logActivity("UPDATE_ADMIN", `Updated administrator ${updatedUser.username}`);

    return NextResponse.json(
      {
        success: true,
        message:
          "Admin updated successfully",

        user: updatedUser,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "UPDATE_ADMIN_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to update admin");
  }
}


// ======================================================
// DELETE ADMIN
// ======================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // FIND ADMIN
    // =========================================

    const admin =
      await prisma.admin.findUnique({
        where: {
          admin_id: Number(id),
        },
      });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found",
        },
        {
          status: 404,
        }
      );
    }

    // =========================================
    // PREVENT SELF-REMOVAL
    // =========================================
    //
    // A SUPER_ADMIN must never be able to remove their own
    // administrator access from the current session - this would be
    // an unsafe/unrecoverable action if it were the only privileged
    // account signed in.

    if (admin.user_id === auth.decoded.user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot remove your own administrator account",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // DELETE ADMIN + USER (ATOMIC)
    // =========================================

    await prisma.$transaction([
      prisma.admin.delete({
        where: {
          admin_id: Number(id),
        },
      }),

      prisma.user.delete({
        where: {
          user_id: admin.user_id,
        },
      }),
    ]);

    void logActivity("DELETE_ADMIN", `Removed administrator ID ${admin.user_id}`);

    return NextResponse.json(
      {
        success: true,
        message:
          "Admin deleted successfully",
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "DELETE_ADMIN_ERROR",
      error
    );

    return prismaErrorResponse(error, "Failed to delete admin");
  }
}