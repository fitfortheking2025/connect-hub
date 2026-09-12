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
  const isPublicConnectMember = nextUrl.pathname.startsWith("/connect-member");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  // Bypass Service Worker and PWA asset requests
  const isPwaAsset = 
    nextUrl.pathname === "/sw.js" ||
    nextUrl.pathname.startsWith("/workbox-") ||
    nextUrl.pathname.startsWith("/icons/") ||
    nextUrl.pathname === "/manifest.json" ||
    nextUrl.pathname === "/manifest.webmanifest" ||
    nextUrl.pathname === "/connect-hub.png";

  if (isPwaAsset || isPublicSchedule || isPublicIntake || isPublicConnectMember) {
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
    /*
     * Match all request paths except for:
     * - API routes (/api/*)
     * - Static files (_next/static, _next/image, favicon.ico)
     * - PWA files (sw.js, workbox-*, manifest*, icons, logos)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|workbox-.*|manifest.webmanifest|manifest.json|manifest.ts|connect-hub.png|icons/.*).*)",
  ],
};