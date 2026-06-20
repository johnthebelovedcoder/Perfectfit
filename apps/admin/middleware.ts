import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static assets through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // JWT is stored in localStorage — not accessible in middleware (edge runtime).
  // We rely on the API's auth guards for data protection.
  // However we can check the presence of the auth cookie/token hint if one is set.
  // For now: redirect to /login if no admin_auth_hint cookie is present.
  // The login page sets this cookie on successful auth; logout clears it.
  const authHint = request.cookies.get("thread_admin_auth");

  if (!authHint) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
