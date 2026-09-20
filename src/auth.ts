import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const [ipRateLimit, accountRateLimit] = await Promise.all([
          enforceRateLimit("admin-login-ip", getClientIp(request.headers)),
          enforceRateLimit("admin-login-account", parsed.data.email),
        ]);
        if (!ipRateLimit.allowed || !accountRateLimit.allowed) return null;

        const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email } });
        if (!admin || !admin.active) return null;

        const passwordMatches = await bcrypt.compare(parsed.data.password, admin.passwordHash);
        if (!passwordMatches) return null;

        return { id: admin.id, email: admin.email, name: admin.name ?? "GearLab Admin" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.adminId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.adminId) session.user.id = token.adminId;
      return session;
    },
  },
});
