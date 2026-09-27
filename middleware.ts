import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ""
);

const COOKIE_NAME = "mentra_token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Block access to internal/hidden files
  if (pathname.startsWith("/.") || pathname.includes("/..")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 2. Protected routes requiring authentication
  const isProtectedRoute = pathname.startsWith("/dashboard");
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (isProtectedRoute) {
    let isValidUser = false;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload && payload.id) {
          isValidUser = true;
        }
      } catch {
        isValidUser = false;
      }
    }

    if (!isValidUser) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(loginUrl);
      // Clean invalid token if expired
      if (token) {
        res.cookies.delete(COOKIE_NAME);
      }
      return res;
    }
  }

  // 3. Attach Global Production Security Headers
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=(), interest-cohort=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svgs, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
