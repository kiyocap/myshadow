import { NextResponse } from "next/server";
import { z } from "zod";

import { databaseReady } from "@/lib/db-shadow";
import {
  blockMobileUser,
  listMobileBlocks,
  unblockMobileUser
} from "@/lib/mobile-blocks";

const identitySchema = z.object({
  userKey: z.string().optional().nullable(),
  inviteCode: z.string().optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  displayName: z.string().optional().nullable(),
  mobileSessionToken: z.string().optional().nullable(),
  appleUserId: z.string().optional().nullable()
});

const candidateSchema = z.object({
  userId: z.string().optional().nullable(),
  inviteCode: z.string().optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  candidateId: z.string().optional().nullable(),
  name: z.string().min(1),
  occupation: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  sharedResonance: z.string().optional().nullable(),
  trait: z.string().optional().nullable()
});

const blockSchema = z.object({
  identity: identitySchema,
  action: z.enum(["list", "block", "unblock"]),
  candidate: candidateSchema.optional()
});

function authResponse(error: Error) {
  if (error.message === "LIVE_AUTH_REQUIRED" || error.message === "MOBILE_IDENTITY_REQUIRED") {
    return NextResponse.json(
      { error: "Sign in with Apple is required before managing blocks." },
      { status: 401 }
    );
  }
  if (error.message === "LIVE_AUTH_EXPIRED") {
    return NextResponse.json(
      { error: "Your live session expired. Please sign in with Apple again." },
      { status: 401 }
    );
  }
  return null;
}

export async function POST(request: Request) {
  if (!databaseReady()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required for mobile blocks." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = blockSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid block payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { identity, action, candidate } = parsed.data;
  if (action !== "list" && !candidate) {
    return NextResponse.json(
      { error: "A candidate is required for block actions." },
      { status: 400 }
    );
  }

  try {
    if (action === "list") {
      return NextResponse.json(await listMobileBlocks(identity));
    }
    if (action === "block") {
      return NextResponse.json(await blockMobileUser(identity, candidate!));
    }
    return NextResponse.json(await unblockMobileUser(identity, candidate!));
  } catch (error) {
    if (error instanceof Error) {
      const auth = authResponse(error);
      if (auth) return auth;

      if (error.message === "CANDIDATE_NOT_REACHABLE") {
        return NextResponse.json(
          { error: "This person is not connected to a live Shadow account yet." },
          { status: 409 }
        );
      }

      if (error.message === "SELF_BLOCK") {
        return NextResponse.json(
          { error: "You cannot block yourself." },
          { status: 409 }
        );
      }
    }

    throw error;
  }
}
