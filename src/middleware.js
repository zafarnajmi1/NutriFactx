import { NextResponse } from "next/server";

const SESSION_COOKIE = "nf_dashboard_session";
const CANONICAL_HOST = "nutrifactx.com";

function parseHost(value) {
  return String(value || "")
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();
}

function redirectWwwToApex(request) {
  const host = parseHost(request.headers.get("host"));
  const forwarded = parseHost(request.headers.get("x-forwarded-host"));

  // Already on the canonical host — do not redirect (avoids proxy header loops).
  if (host === CANONICAL_HOST) return null;
  if (host !== `www.${CANONICAL_HOST}` && forwarded !== `www.${CANONICAL_HOST}`) {
    return null;
  }

  const dest = new URL(request.url);
  dest.hostname = CANONICAL_HOST;
  dest.protocol = "https:";
  dest.port = "";
  return NextResponse.redirect(dest, 301);
}

const MANAGER_ALLOWED_PREFIXES = [
  "/dashboard/articles",
  "/dashboard/comments",
];

function parseSession(request) {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (parsed?.email && (parsed.role === "admin" || parsed.role === "manager")) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function isManagerAllowedPath(pathname) {
  return MANAGER_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request) {
  const wwwRedirect = redirectWwwToApex(request);
  if (wwwRedirect) return wwwRedirect;

  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  if (!isDashboard) return NextResponse.next();

  const isLogin = pathname === "/dashboard/login";
  const session = parseSession(request);
  const loggedIn = Boolean(session);

  if (!isLogin && !loggedIn) {
    const loginUrl = new URL("/dashboard/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLogin && loggedIn) {
    const home =
      session.role === "manager" ? "/dashboard/articles" : "/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (loggedIn && session.role === "manager" && !isLogin) {
    if (!isManagerAllowedPath(pathname)) {
      return NextResponse.redirect(new URL("/dashboard/articles", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
