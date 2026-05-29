import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { databaseReady } from "@/lib/db-shadow";
import { getPrisma } from "@/lib/prisma";

const demoEmailSchema = z.object({
  email: z.string().email(),
  callbackUrl: z.string().min(1).optional()
});

function sessionCookieNames() {
  return process.env.NODE_ENV === "production"
    ? ["__Secure-next-auth.session-token", "next-auth.session-token"]
    : ["next-auth.session-token"];
}

export async function POST(request: Request) {
  if (process.env.DEMO_EMAIL_AUTH_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Demo email access is not enabled." },
      { status: 404 }
    );
  }

  if (!databaseReady()) {
    return NextResponse.json(
      { error: "Database is required for demo email access." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = demoEmailSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const db = getPrisma();
  const email = parsed.data.email.toLowerCase();
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const user = await db.user.upsert({
    where: { email },
    create: { email },
    update: {}
  });

  await db.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires
    }
  });

  const response = NextResponse.json({
    ok: true,
    callbackUrl: parsed.data.callbackUrl ?? "/dashboard"
  });

  for (const name of sessionCookieNames()) {
    response.cookies.set(name, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires
    });
  }

  return response;
}
