import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";


// ======================================================
// LOGOUT USER
// ======================================================

export async function POST(
  req: NextRequest
) {
  try {

    // =========================================
    // AUTHORIZATION
    // =========================================

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    // =========================================
    // SUCCESS RESPONSE
    // =========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Logout successful",
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.log(
      "LOGOUT_ERROR",
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
