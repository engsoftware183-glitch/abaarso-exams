import { NextRequest, NextResponse } from "next/server";


// ======================================================
// LOGOUT USER
// ======================================================

export async function POST(
  req: NextRequest
) {
  try {

    // =========================================
    // CHECK AUTHORIZATION HEADER
    // =========================================

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
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