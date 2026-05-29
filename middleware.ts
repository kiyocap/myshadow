import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.REQUIRE_AUTH !== "true") {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token");

  if (!hasSession && request.nextUrl.pathname.startsWith("/dashboard")) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
