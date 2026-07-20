import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

import {
  Role,
} from "@prisma/client";


// ======================================================
// BULK REGISTER USERS
// ======================================================

export async function POST(
  req: NextRequest
) {
  try {

    // =========================================
    // GET BODY
    // =========================================

    const body =
      await req.json();

    const { users } =
      body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !users ||
      !Array.isArray(users)
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Users array is required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // FORMAT USERS
    // =========================================

    const formattedUsers =
      await Promise.all(

        users.map(
          async (
            user: {
              username: string;
              email: string;
              password: string;
              role: Role;
            }
          ) => ({

            username:
              String(
                user.username
              ),

            email:
              String(
                user.email
              ),

            password:
              await bcrypt.hash(
                String(
                  user.password
                ),
                10
              ),

            role:
              user.role as Role,
          })
        )

      );

    // =========================================
    // CREATE MANY USERS
    // =========================================

    const createdUsers =
      await prisma.user.createMany({

        data:
          formattedUsers,

        skipDuplicates: true,
      });

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Users registered successfully",

        count:
          createdUsers.count,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.log(
      "BULK_REGISTER_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to register users",
      },
      {
        status: 500,
      }
    );
  }
}