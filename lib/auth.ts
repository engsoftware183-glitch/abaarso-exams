import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export interface JwtPayload {
  id: string;
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

// ======================================================
// SHARED AUTH GUARD
// ======================================================
//
// Centralizes the Authorization header -> verifyToken -> role check
// sequence used across route handlers, so every route enforces the
// same rules (Bearer scheme, 401 on missing/invalid token, 403 on
// disallowed role) instead of re-implementing it per file.

export type AuthResult =
  | { ok: true; decoded: JwtPayload }
  | { ok: false; response: NextResponse };

export function requireAuth(
  req: Request,
  allowedRoles?: string[]
): AuthResult {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

  const token = authHeader.split(" ")[1];
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