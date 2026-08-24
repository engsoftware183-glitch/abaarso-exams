import crypto from "crypto";
import bcrypt from "bcryptjs";

// ======================================================
// RESET CODE GENERATION / HASHING
// ======================================================
//
// Uses bcrypt for the code hash, matching the project's existing
// password-hashing convention (bcryptjs is already the only hashing
// primitive used elsewhere in this codebase).

export const RESET_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const RESET_CODE_MAX_ATTEMPTS = 5;

export function generateResetCode(): string {
  // crypto.randomInt is cryptographically secure and gives a uniform
  // distribution across [100000, 999999] -> always exactly 6 digits.
  const code = crypto.randomInt(100000, 1000000);
  return code.toString();
}

export async function hashResetCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function compareResetCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
