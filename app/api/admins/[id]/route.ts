import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";


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

    const token =
      authHeader.split(" ")[1];

    const decoded =
      verifyToken(token);

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
    // GET ADMIN
    // =========================================

    const admin =
      await prisma.admin.findUnique({
        where: {
          admin_id: Number(id),
        },

        include: {
          user: true,
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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch admin",
      },
      {
        status: 500,
      }
    );
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

    const token =
      authHeader.split(" ")[1];

    const decoded =
      verifyToken(token);

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

    if (
      decoded.role !== "SUPER_ADMIN"
    ) {
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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update admin",
      },
      {
        status: 500,
      }
    );
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

    const token =
      authHeader.split(" ")[1];

    const decoded =
      verifyToken(token);

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

    if (
      decoded.role !== "SUPER_ADMIN"
    ) {
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
    // DELETE ADMIN
    // =========================================

    await prisma.admin.delete({
      where: {
        admin_id: Number(id),
      },
    });

    // =========================================
    // DELETE USER
    // =========================================

    await prisma.user.delete({
      where: {
        user_id: admin.user_id,
      },
    });

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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete admin",
      },
      {
        status: 500,
      }
    );
  }
}