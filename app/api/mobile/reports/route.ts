import { NextResponse } from "next/server";
import { z } from "zod";

import { databaseReady } from "@/lib/db-shadow";
import { requireLiveMobileUser } from "@/lib/mobile-auth";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const identitySchema = z.object({
  userKey: z.string().optional().nullable(),
  inviteCode: z.string().optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  displayName: z.string().optional().nullable(),
  mobileSessionToken: z.string().optional().nullable(),
  appleUserId: z.string().optional().nullable()
});

const reportSchema = z.object({
  identity: identitySchema,
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
  appBuild: z.string().trim().max(64).optional().nullable(),
  appVersion: z.string().trim().max(64).optional().nullable(),
  threadId: z.string().trim().max(128).optional().nullable(),
  messageId: z.string().trim().max(128).optional().nullable()
});

export async function POST(request: Request) {
  if (!databaseReady()) {
    return NextResponse.json(
      { error: "DATABASE_URL is required for mobile reports." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid report payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const report = parsed.data;
  let reporter;
  try {
    reporter = await requireLiveMobileUser(report.identity);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "LIVE_AUTH_REQUIRED" || error.message === "MOBILE_IDENTITY_REQUIRED")
    ) {
      return NextResponse.json(
        { error: "Sign in with Apple is required before submitting live reports." },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "LIVE_AUTH_EXPIRED") {
      return NextResponse.json(
        { error: "Your live session expired. Please sign in with Apple again." },
        { status: 401 }
      );
    }
    throw error;
  }

  const receivedAt = new Date();
  const db = getPrisma();
  const storedReport = await db.safetyReport.upsert({
    where: { id: report.reportId },
    create: {
      id: report.reportId,
      reporterId: reporter.id,
      reportedUserId: report.reportedUserId,
      reportedUserName: report.reportedUserName,
      threadId: report.threadId ?? null,
      messageId: report.messageId ?? null,
      reason: report.reason,
      reasonLabel: report.reasonLabel,
      details: report.details?.trim() || null,
      appBuild: report.appBuild ?? null,
      appVersion: report.appVersion ?? null,
      createdAt: report.createdAt ?? receivedAt,
      receivedAt
    },
    update: {
      reporterId: reporter.id,
      reportedUserId: report.reportedUserId,
      reportedUserName: report.reportedUserName,
      threadId: report.threadId ?? null,
      messageId: report.messageId ?? null,
      reason: report.reason,
      reasonLabel: report.reasonLabel,
      details: report.details?.trim() || null,
      appBuild: report.appBuild ?? null,
      appVersion: report.appVersion ?? null
    }
  });
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
          `Reporter: ${reporter.email ?? report.reporterEmail ?? "unknown"} (${reporter.id})`,
          `Reported user: ${report.reportedUserName} (${report.reportedUserId})`,
          `Reason: ${report.reasonLabel} (${report.reason})`,
          `Created at: ${(report.createdAt ?? receivedAt).toISOString()}`,
          `Received at: ${receivedAt.toISOString()}`,
          `App build: ${report.appBuild ?? "unknown"}`,
          `Stored report: ${storedReport.id}`,
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
      reporterEmail: reporter.email ?? report.reporterEmail ?? null,
      reporterUserId: reporter.id,
      reportedUserId: report.reportedUserId,
      reportedUserName: report.reportedUserName,
      reason: report.reason,
      receivedAt: receivedAt.toISOString()
    });
  }

  return NextResponse.json({
    ok: true,
    stored: true,
    reportId: storedReport.id,
    delivered
  });
}
