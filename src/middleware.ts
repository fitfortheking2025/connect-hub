// middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;

  const isAuthPage = nextUrl.pathname === "/login";
  const isPublicIntake = nextUrl.pathname.startsWith("/intake");
  const isPublicSchedule = nextUrl.pathname.startsWith("/schedule");
  const isPublicConnectMember = nextUrl.pathname.startsWith("/connect-member"); // Allow public member updates
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  if (isPublicSchedule || isPublicIntake || isPublicConnectMember) {
    return NextResponse.next();
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  if (isAdminRoute && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|manifest.json|manifest.ts|connect-hub.png).*)",
  ],
};