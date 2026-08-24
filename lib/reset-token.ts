import jwt from "jsonwebtoken";

// ======================================================
// SHORT-LIVED PASSWORD-RESET GRANT TOKEN
// ======================================================
//
// This is deliberately NOT a normal auth token: it carries a fixed
// "purpose" claim, a short (10 minute) expiry, and no role/username
// data, so it can never be used to authenticate API requests - only
// to prove that /api/auth/verify-reset-code just succeeded for this
// user and this specific reset code.

const RESET_TOKEN_PURPOSE = "password-reset";
const RESET_TOKEN_TTL = "10m";

export interface ResetTokenPayload {
  user_id: number;
  code_id: number;
  purpose: typeof RESET_TOKEN_PURPOSE;
}

export function signResetToken(userId: number, codeId: number): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in .env");
  }

  return jwt.sign(
    {
      user_id: userId,
      code_id: codeId,
      purpose: RESET_TOKEN_PURPOSE,
    },
    process.env.JWT_SECRET,
    { expiresIn: RESET_TOKEN_TTL }
  );
}

export function verifyResetToken(token: string): ResetTokenPayload | null {
  if (!process.env.JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as Partial<ResetTokenPayload>;

    if (
      decoded.purpose !== RESET_TOKEN_PURPOSE ||
      typeof decoded.user_id !== "number" ||
      typeof decoded.code_id !== "number"
    ) {
      return null;
    }

    return decoded as ResetTokenPayload;
  } catch {
    return null;
  }
}
