import { NextResponse } from "next/server";
import { z } from "zod";

import { databaseReady } from "@/lib/db-shadow";
import { createAppleMobileSession } from "@/lib/mobile-auth";

const sessionSchema = z.object({
  identityToken: z.string().min(20),
  appleUserId: z.string().min(1).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  displayName: z.string().trim().min(1).max(120).optional().nullable()
});

function authError(error: Error) {
  switch (error.message) {
    case "APPLE_KEYS_UNAVAILABLE":
      return NextResponse.json(
        { error: "Apple sign-in is temporarily unavailable. Please try again." },
        { status: 503 }
      );
    case "APPLE_TOKEN_EXPIRED":
      return NextResponse.json(
        { error: "Apple sign-in expired. Please sign in again." },
        { status: 401 }
      );
    case "APPLE_TOKEN_AUDIENCE":
    case "APPLE_TOKEN_INVALID":
      return NextResponse.json(
        { error: "Apple sign-in could not be verified for this app." },
        { status: 401 }
      );
    default:
      return null;
  }
}

export async function POST(request: Request) {
  if (!databaseReady()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required for mobile sign-in." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = sessionSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid mobile sign-in payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await createAppleMobileSession(parsed.data));
  } catch (error) {
    if (error instanceof Error) {
      const response = authError(error);
      if (response) return response;
    }
    throw error;
  }
}
