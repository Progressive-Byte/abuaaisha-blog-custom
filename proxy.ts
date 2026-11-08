import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = new Set([
    "/admin/login",
    "/admin/login/",
    "/admin/forgot-password",
    "/admin/forgot-password/",
    "/admin/reset-password",
    "/admin/reset-password/",
  ]);
  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (session) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login/";
  url.search = "";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
