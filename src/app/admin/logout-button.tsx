"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return <button className="button button-secondary admin-submit" type="button" onClick={() => signOut({ callbackUrl: "/admin/login" })}>Sign out</button>;
}
