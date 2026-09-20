import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  const admin = await prisma.admin.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, name: true, active: true } });
  if (!admin?.active) throw new Error("UNAUTHORIZED");
  return { id: admin.id, email: admin.email, name: admin.name ?? "GearLab Admin" };
}
