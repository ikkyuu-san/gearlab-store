import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../src/lib/prisma";

const adminInput = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(200),
});

async function main() {
  const parsed = adminInput.safeParse({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  if (!parsed.success) {
    throw new Error("Set a valid ADMIN_EMAIL and an ADMIN_PASSWORD with at least 12 characters in .env before running db:seed:admin.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.admin.upsert({
    where: { email: parsed.data.email },
    update: { passwordHash, active: true },
    create: { email: parsed.data.email, passwordHash, name: "GearLab Admin" },
  });

  console.log("Admin account configured successfully.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unable to configure the admin account.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
