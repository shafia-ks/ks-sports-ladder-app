import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Placeholder middleware for auth/RBAC checks
// TODO: integrate Supabase auth session checks and role-based access
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    // TODO: verify user session and role === 'admin' or 'organizer'
    // For now, allow all (development mode)
  }

  // Protect user routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/challenges/create") ||
    pathname.startsWith("/matches/submit")
  ) {
    // TODO: verify user session exists
    // For now, allow all (development mode)
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/challenges/create", "/matches/submit"],
};
