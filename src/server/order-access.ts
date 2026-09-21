import { createHash } from "node:crypto";
import { cookies } from "next/headers";

const PUBLIC_ACCESS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,}$/;

export function isValidPublicAccessToken(value: string) {
  return PUBLIC_ACCESS_TOKEN_PATTERN.test(value);
}

export function orderAccessCookieName(orderNumber: string) {
  const orderHash = createHash("sha256").update(orderNumber).digest("hex").slice(0, 20);
  return `gearlab_order_access_${orderHash}`;
}

export function orderAccessCookiePath(orderNumber: string) {
  return `/order/${encodeURIComponent(orderNumber)}`;
}

export async function setOrderAccessCookie(orderNumber: string, token: string) {
  const cookieStore = await cookies();
  cookieStore.set(orderAccessCookieName(orderNumber), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: orderAccessCookiePath(orderNumber),
    maxAge: 60 * 60 * 24 * 30,
  });
}
