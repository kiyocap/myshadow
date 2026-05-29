import { NextResponse } from "next/server";

import {
  databaseReady,
  getRequiredUserId,
  saveShadowSchema,
  saveUserShadow
} from "@/lib/db-shadow";

export async function POST(request: Request) {
  if (!databaseReady()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required to save Shadows." },
      { status: 503 }
    );
  }

  let userId: string;

  try {
    userId = await getRequiredUserId();
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = saveShadowSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Shadow profile", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const proxy = await saveUserShadow(userId, parsed.data);

  return NextResponse.json({ id: proxy.id });
}
