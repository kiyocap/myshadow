import { NextResponse } from "next/server";
import { z } from "zod";

import { databaseReady } from "@/lib/db-shadow";
import { likeMobileMatch } from "@/lib/mobile-matches";

const identitySchema = z.object({
  userKey: z.string().optional().nullable(),
  inviteCode: z.string().optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  displayName: z.string().optional().nullable()
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

const likeSchema = z.object({
  identity: identitySchema,
  candidate: candidateSchema
});

export async function POST(request: Request) {
  if (!databaseReady()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required for live likes." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = likeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid like payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(
      await likeMobileMatch(parsed.data.identity, parsed.data.candidate)
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "MOBILE_IDENTITY_REQUIRED") {
        return NextResponse.json(
          { error: "Sign in is required before liking live matches." },
          { status: 401 }
        );
      }

      if (error.message === "CANDIDATE_NOT_REACHABLE") {
        return NextResponse.json(
          { error: "This match is not connected to a live Shadow account yet." },
          { status: 409 }
        );
      }

      if (error.message === "SELF_LIKE") {
        return NextResponse.json(
          { error: "You cannot match with yourself." },
          { status: 409 }
        );
      }
    }

    throw error;
  }
}
