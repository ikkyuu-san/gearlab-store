import { auth } from "@/auth";
import { Brand } from "@/components/site/brand";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const session = await auth();
  if (session) redirect("/admin");

  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" && params.callbackUrl.startsWith("/admin") ? params.callbackUrl : "/admin";

  return (
    <main className="admin-shell">
      <section className="admin-card" aria-labelledby="admin-login-title">
        <Brand />
        <p className="eyebrow admin-eyebrow">GearLab / Secure area</p>
        <h1 id="admin-login-title">Admin sign in</h1>
        <p className="admin-description">Sign in to manage the GearLab catalog.</p>
        <LoginForm callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
