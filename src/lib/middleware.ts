
import { NextResponse } from "next/server";
import { auth } from "./auth";
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;

  const isAuthPage = nextUrl.pathname === "/login";
  const isPublicIntake = nextUrl.pathname.startsWith("/intake");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  // Allow public intake form without authentication
  if (isPublicIntake) {
    return NextResponse.next();
  }

  // If on login page and already logged in, redirect to portal dashboard
  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // Protect all other portal routes
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

  // Role Gate: Protect admin-only routes
  if (isAdminRoute && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|connect-hub.png).*)"],
};