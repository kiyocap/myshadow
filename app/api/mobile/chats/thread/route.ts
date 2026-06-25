import { NextResponse } from "next/server";
import { z } from "zod";

import { databaseReady } from "@/lib/db-shadow";
import { getMobileThread, sendMobileMessage } from "@/lib/mobile-chat";

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

const threadSchema = z.object({
  identity: identitySchema,
  candidate: candidateSchema,
  message: z.string().optional().nullable()
});

export async function POST(request: Request) {
  if (!databaseReady()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required for mobile chats." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = threadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid chat thread payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { identity, candidate, message } = parsed.data;
    const text = message?.trim();
    const thread = text
      ? await sendMobileMessage(identity, candidate, text)
      : await getMobileThread(identity, candidate);

    return NextResponse.json(thread);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "MOBILE_IDENTITY_REQUIRED") {
        return NextResponse.json(
          { error: "Sign in with Apple is required before chats can sync." },
          { status: 401 }
        );
      }

      if (error.message === "LIVE_AUTH_REQUIRED") {
        return NextResponse.json(
          { error: "Sign in with Apple is required before live chats can sync." },
          { status: 401 }
        );
      }

      if (error.message === "LIVE_AUTH_EXPIRED") {
        return NextResponse.json(
          { error: "Your live session expired. Please sign in with Apple again." },
          { status: 401 }
        );
      }

      if (error.message === "CANDIDATE_NOT_REACHABLE") {
        return NextResponse.json(
          { error: "This match is not connected to a live Shadow account yet." },
          { status: 409 }
        );
      }

      if (error.message === "SELF_CHAT") {
        return NextResponse.json(
          { error: "You cannot open a chat with yourself." },
          { status: 409 }
        );
      }

      if (error.message === "CHAT_REQUIRES_MUTUAL_MATCH") {
        return NextResponse.json(
          { error: "Chat opens after both people say yes." },
          { status: 403 }
        );
      }

      if (error.message === "CHAT_BLOCKED") {
        return NextResponse.json(
          { error: "This conversation is blocked." },
          { status: 403 }
        );
      }

      if (error.message === "EMPTY_MESSAGE") {
        return NextResponse.json(
          { error: "Enter a message before sending." },
          { status: 400 }
        );
      }
    }

    throw error;
  }
}
