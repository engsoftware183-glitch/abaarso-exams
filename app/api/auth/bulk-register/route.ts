import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";
import { logActivity } from "@/lib/activity-log";


// ======================================================
// BULK REGISTER USERS
// ======================================================

export async function POST(
  req: NextRequest
) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);

    if (!auth.ok) {
      return auth.response;
    }

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

    // Bulk registration must never allow the caller to choose a role
    // per row (ADMIN/SUPER_ADMIN) - every row is created as STUDENT.
    const formattedUsers =
      await Promise.all(

        users.map(
          async (
            user: {
              username: string;
              email: string;
              password: string;
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

            role: "STUDENT" as const,
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

    void logActivity("BULK_REGISTER_USERS", `Registered ${createdUsers.count} users`);

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

    return prismaErrorResponse(error, "Failed to register users");
  }
}