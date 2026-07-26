import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";


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

    const auth = requireAuth(req);

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

          role:
            role ||
            existingAdmin.user.role,
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