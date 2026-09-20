import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login") return NextResponse.next();
  if (request.auth) return NextResponse.next();

  const loginUrl = new URL("/admin/login", request.nextUrl.origin);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
});

export const config = { matcher: ["/admin/:path*"] };
