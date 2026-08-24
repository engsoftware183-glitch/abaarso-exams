import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from "../lib/password-policy";

// ======================================================
// EMERGENCY SUPER_ADMIN PASSWORD RESET (developer CLI only)
// ======================================================
//
// Not exposed as an API route. Run locally / on the server with
// direct database access:
//
//   SUPER_ADMIN_RESET_EMAIL=superadmin@abaarso.edu \
//   SUPER_ADMIN_RESET_PASSWORD=NewSecurePass1 \
//   npm run reset-super-admin-password
//
// - Only ever targets an account that already has role SUPER_ADMIN.
// - Never creates a new account.
// - Never prints the plaintext password.
// - Clears failed_login_attempts / locked_until and invalidates any
//   active password-reset codes for that account.

async function main() {
  const email = process.env.SUPER_ADMIN_RESET_EMAIL;
  const password = process.env.SUPER_ADMIN_RESET_PASSWORD;

  if (!email || !password) {
    console.error(
      "Usage: SUPER_ADMIN_RESET_EMAIL=<email> SUPER_ADMIN_RESET_PASSWORD=<password> npm run reset-super-admin-password"
    );
    process.exitCode = 1;
    return;
  }

  if (!isPasswordValid(password)) {
    console.error(`Refusing to set password: ${PASSWORD_POLICY_MESSAGE}`);
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error("No account found for that email.");
    process.exitCode = 1;
    return;
  }

  if (user.role !== "SUPER_ADMIN") {
    console.error("Refusing to reset password: target account is not SUPER_ADMIN.");
    process.exitCode = 1;
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password: hashedPassword,
        failed_login_attempts: 0,
        locked_until: null,
      },
    }),
    prisma.passwordResetCode.updateMany({
      where: { user_id: user.user_id, used_at: null },
      data: { used_at: new Date() },
    }),
  ]);

  console.log(`SUPER_ADMIN password reset successfully for ${email}.`);
}

main()
  .catch((error) => {
    console.error("RESET_SUPER_ADMIN_PASSWORD_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
