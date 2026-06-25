import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reportSchema = z.object({
  reportId: z.string().min(1).max(128),
  reporterEmail: z.string().trim().email().optional().nullable(),
  reportedUserId: z.string().min(1).max(128),
  reportedUserName: z.string().trim().min(1).max(120),
  reason: z.enum([
    "harassment",
    "inappropriate",
    "spam",
    "fakeProfile",
    "underage",
    "other"
  ]),
  reasonLabel: z.string().trim().min(1).max(120),
  details: z.string().trim().max(4000).optional().nullable(),
  createdAt: z.coerce.date().optional(),
  appBuild: z.string().trim().max(64).optional().nullable()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid report payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const report = parsed.data;
  const receivedAt = new Date();
  const safetyInbox =
    process.env.SAFETY_REPORT_EMAIL ?? "hewie@humanityone.world";

  let delivered = false;

  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: safetyInbox,
        subject: `Shadow safety report: ${report.reasonLabel}`,
        text: [
          "A mobile safety report was submitted.",
          "",
          `Report ID: ${report.reportId}`,
          `Reporter: ${report.reporterEmail ?? "unknown"}`,
          `Reported user: ${report.reportedUserName} (${report.reportedUserId})`,
          `Reason: ${report.reasonLabel} (${report.reason})`,
          `Created at: ${(report.createdAt ?? receivedAt).toISOString()}`,
          `Received at: ${receivedAt.toISOString()}`,
          `App build: ${report.appBuild ?? "unknown"}`,
          "",
          "Details:",
          report.details?.trim() || "(none)"
        ].join("\n")
      });
      delivered = true;
    } catch (error) {
      console.error("Failed to email mobile safety report", error);
    }
  } else {
    console.warn("Mobile safety report received without email delivery", {
      reportId: report.reportId,
      reporterEmail: report.reporterEmail ?? null,
      reportedUserId: report.reportedUserId,
      reportedUserName: report.reportedUserName,
      reason: report.reason,
      receivedAt: receivedAt.toISOString()
    });
  }

  return NextResponse.json({ ok: true, delivered });
}
