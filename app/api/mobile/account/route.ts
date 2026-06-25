import { NextResponse } from "next/server";
import { z } from "zod";

import { databaseReady } from "@/lib/db-shadow";
import { deleteMobileAccount } from "@/lib/mobile-account";
import { requireLiveMobileUser } from "@/lib/mobile-auth";

const identitySchema = z.object({
  userKey: z.string().optional().nullable(),
  inviteCode: z.string().optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  displayName: z.string().optional().nullable(),
  mobileSessionToken: z.string().optional().nullable(),
  appleUserId: z.string().optional().nullable()
});

const mobileAccountDeleteSchema = z.object({
  identity: identitySchema
});

export async function DELETE(request: Request) {
  if (!databaseReady()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required to delete account data." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => ({}));
  const parsed = mobileAccountDeleteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid deletion payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const user = await requireLiveMobileUser(parsed.data.identity);
    return NextResponse.json(await deleteMobileAccount(user.id));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "LIVE_AUTH_REQUIRED" || error.message === "MOBILE_IDENTITY_REQUIRED") {
        return NextResponse.json(
          { error: "Sign in with Apple is required before deleting a live account." },
          { status: 401 }
        );
      }
      if (error.message === "LIVE_AUTH_EXPIRED") {
        return NextResponse.json(
          { error: "Your live session expired. Please sign in with Apple again before deleting your account." },
          { status: 401 }
        );
      }
    }
    throw error;
  }
}
