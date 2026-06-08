import { NextResponse } from "next/server";
import { z } from "zod";

import { joinWaitlist } from "@/lib/waitlist-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const waitlistSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.")
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Enter a valid email address.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await joinWaitlist(parsed.data.email);

    // TODO(integration): forward this email to your real provider here.
    // The local store above already persisted it; this is where you would
    // mirror it to Resend / Mailchimp / ConvertKit. Kept optional so the page
    // works with zero configuration.
    // Example (Resend audiences):
    //   if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
    //     const { Resend } = await import("resend");
    //     const resend = new Resend(process.env.RESEND_API_KEY);
    //     await resend.contacts.create({
    //       email: parsed.data.email,
    //       audienceId: process.env.RESEND_AUDIENCE_ID
    //     });
    //   }

    return NextResponse.json({
      ok: true,
      position: result.position,
      spotsRemaining: result.spotsRemaining,
      alreadyJoined: result.alreadyJoined
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
