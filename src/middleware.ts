// middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;

  // 1. Bypass any static asset files (scripts, workers, images, manifests, icons)
  if (
    nextUrl.pathname.endsWith(".js") ||
    nextUrl.pathname.endsWith(".json") ||
    nextUrl.pathname.endsWith(".png") ||
    nextUrl.pathname.endsWith(".ico") ||
    nextUrl.pathname.includes("workbox-") ||
    nextUrl.pathname.includes("swe-worker-")
  ) {
    return NextResponse.next();
  }

  const isAuthPage = nextUrl.pathname === "/login";
  const isPublicIntake = nextUrl.pathname.startsWith("/intake");
  const isPublicSchedule = nextUrl.pathname.startsWith("/schedule");
  const isPublicConnectMember = nextUrl.pathname.startsWith("/connect-member");
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
    /*
     * Match all request paths except:
     * - API routes (/api/*)
     * - Next.js internal static assets (_next/static, _next/image)
     * - Public static file extensions (.js, .json, .png, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:js|json|png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};