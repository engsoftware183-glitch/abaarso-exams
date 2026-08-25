import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, type JwtPayload } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/cookies";

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/verify-reset-code",
  "/api/auth/reset-password",
  "/api/auth/bulk-register",
  "/api/auth/me",
];

const ADMIN_PATHS = [
  "/dashboard",
  "/academics",
  "/faculties",
  "/departments",
  "/semesters",
  "/courses",
  "/students",
  "/attendance",
  "/assessments",
  "/exams",
  "/student-exams",
  "/results",
  "/reports",
  "/administrators",
  "/audit-logs",
  "/tools",
  "/transcripts",
];

const STUDENT_PATHS = [
  "/student",
];

const AUTHENTICATED_PATHS = [
  "/profile",
  "/settings",
  "/notifications",
];

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/verify/transcript/")) return true;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return false;
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isStudentPath(pathname: string): boolean {
  return STUDENT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthenticatedPath(pathname: string): boolean {
  return AUTHENTICATED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function getDecodedToken(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const decoded = getDecodedToken(request);

  const isAuthenticated = !!decoded;

  if (isPublicPath(pathname)) {
    if (isAuthenticated && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminPath(pathname)) {
    if (decoded.role !== "SUPER_ADMIN" && decoded.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (isStudentPath(pathname)) {
    if (decoded.role !== "STUDENT" && decoded.role !== "SUPER_ADMIN" && decoded.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (isAuthenticatedPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/" || pathname === "") {
    if (decoded.role === "STUDENT") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
