"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
      callbackUrl,
    });

    setPending(false);
    if (!result || result.error) {
      setError("Unable to sign in with those details.");
      return;
    }

    window.location.assign(result.url ?? callbackUrl);
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <label htmlFor="admin-email">Email</label>
      <input id="admin-email" name="email" type="email" autoComplete="username" required />
      <label htmlFor="admin-password">Password</label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" required />
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      <button className="button button-primary admin-submit" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
