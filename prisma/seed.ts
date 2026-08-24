import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

// ======================================================
// BOOTSTRAP SUPER_ADMIN
// ======================================================
//
// Idempotent (upsert keyed on the unique email) so this can be run
// on every deploy without side effects. Guarantees the system can
// never be locked out of SUPER_ADMIN access. Password is only set
// on first creation - re-running this script never resets a
// password that was changed later.

async function main() {
  const email = "superadmin@abaarso.edu";
  const username = "superadmin";
  
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!password) {
  throw new Error("SUPER_ADMIN_PASSWORD environment variable is required");
}
  const hashedPassword = await bcrypt.hash(password, 10);

  const superAdmin = await prisma.user.upsert({
    where: {
      email,
    },

    update: {
      role: "SUPER_ADMIN",
    },

    create: {
      username,
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log(
    `Bootstrap SUPER_ADMIN ready: ${superAdmin.email} (user_id=${superAdmin.user_id})`
  );
}

main()
  .catch((error) => {
    console.error("SEED_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
