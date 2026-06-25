import { NextResponse } from "next/server";
import { z } from "zod";

import { databaseReady } from "@/lib/db-shadow";
import { listMobileChats } from "@/lib/mobile-chat";

const identitySchema = z.object({
  userKey: z.string().optional().nullable(),
  inviteCode: z.string().optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  displayName: z.string().optional().nullable(),
  mobileSessionToken: z.string().optional().nullable(),
  appleUserId: z.string().optional().nullable()
});

const listSchema = z.object({
  identity: identitySchema
});

export async function POST(request: Request) {
  if (!databaseReady()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required for mobile chats." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = listSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid chat list payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await listMobileChats(parsed.data.identity));
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "MOBILE_IDENTITY_REQUIRED" ||
        error.message === "LIVE_AUTH_REQUIRED")
    ) {
      return NextResponse.json(
        { error: "Sign in with Apple is required before chats can sync." },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "LIVE_AUTH_EXPIRED") {
      return NextResponse.json(
        { error: "Your live session expired. Please sign in with Apple again." },
        { status: 401 }
      );
    }
    throw error;
  }
}
