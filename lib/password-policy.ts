// Minimum password policy for self-service password reset.
// No stricter policy exists elsewhere in the project, so this is the floor:
// 8+ chars, at least one uppercase, one lowercase, one digit.
const POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function isPasswordValid(password: string): boolean {
  return typeof password === "string" && POLICY_REGEX.test(password);
}

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.";
