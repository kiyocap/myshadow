import { NextResponse } from "next/server";

import { acceptInviteForUser } from "@/lib/db-meetings";
import { databaseReady, getRequiredUserId } from "@/lib/db-shadow";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!databaseReady()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required to accept invites." },
      { status: 503 }
    );
  }

  let userId: string;

  try {
    userId = await getRequiredUserId();
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { code } = await params;

  try {
    const result = await acceptInviteForUser(code, userId);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "SHADOW_REQUIRED") {
      return NextResponse.json(
        { error: "Create your Shadow before accepting this invite." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "INVITE_FULL") {
      return NextResponse.json(
        { error: "This invite already has two Shadows connected." },
        { status: 409 }
      );
    }

    throw error;
  }
}
