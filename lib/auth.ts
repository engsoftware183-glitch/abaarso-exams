import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";

export interface JwtPayload {
  id: string;
  user_id: number;
  username: string;
  email: string;
  role: string;
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    return decoded;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${AUTH_COOKIE_NAME}=`)) {
      return cookie.slice(`${AUTH_COOKIE_NAME}=`.length);
    }
  }

  return null;
}

// ======================================================
// SHARED AUTH GUARD
// ======================================================
//
// Centralizes the cookie/JWT -> verifyToken -> role check
// sequence used across route handlers, so every route enforces the
// same rules (cookie-based auth, 401 on missing/invalid token, 403 on
// disallowed role) instead of re-implementing it per file.

export type AuthResult =
  | { ok: true; decoded: JwtPayload }
  | { ok: false; response: NextResponse };

export function requireAuth(
  req: Request,
  allowedRoles?: string[]
): AuthResult {
  const token = getTokenFromRequest(req);

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        {
          status: 401,
        }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(decoded.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return { ok: true, decoded };
}