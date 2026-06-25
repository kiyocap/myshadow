import { NextResponse } from "next/server";
import { z } from "zod";

import { databaseReady } from "@/lib/db-shadow";
import { deleteMobileInviteHost } from "@/lib/db-meetings";

const mobileAccountDeleteSchema = z.object({
  inviteCode: z.string().min(4).max(32).optional()
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

  if (!parsed.data.inviteCode) {
    return NextResponse.json({ deleted: true });
  }

  const result = await deleteMobileInviteHost(parsed.data.inviteCode);
  return NextResponse.json(result);
}
