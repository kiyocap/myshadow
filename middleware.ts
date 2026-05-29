import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const protectedPath =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname === "/create-shadow" ||
    request.nextUrl.pathname === "/create-proxy";

  if (!protectedPath && process.env.REQUIRE_AUTH !== "true") {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token");

  if (!hasSession && protectedPath) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/create-shadow", "/create-proxy"]
};
