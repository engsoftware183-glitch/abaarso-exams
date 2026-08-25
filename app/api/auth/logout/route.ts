import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/cookies";
import { logError } from "@/lib/logger";


export async function POST(
  req: NextRequest
) {
  try {

    const auth = requireAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    const response = NextResponse.json(
      {
        success: true,

        message:
          "Logout successful",
      },
      {
        status: 200,
      }
    );

    response.cookies.set(AUTH_COOKIE_NAME, "", {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 0,
      expires: new Date(0),
    });

    return response;

  } catch (error) {

    logError("LOGOUT_ERROR", error);

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
