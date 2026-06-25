import { NextResponse } from "next/server";
import { z } from "zod";

import { databaseReady, saveShadowSchema } from "@/lib/db-shadow";
import { seedMobileInviteHost } from "@/lib/db-meetings";

const mobileInviteSchema = z.object({
  inviteCode: z.string().min(4).max(32),
  shadow: saveShadowSchema
});

export async function POST(request: Request) {
  if (!databaseReady()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required to create invite links." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = mobileInviteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invite payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const invite = await seedMobileInviteHost(
      parsed.data.inviteCode,
      parsed.data.shadow
    );
    return NextResponse.json(invite);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "INVITE_FULL"
        ? "This invite already has two Shadows connected."
        : "The invite link could not be prepared.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
