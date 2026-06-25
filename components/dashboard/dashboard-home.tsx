"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Bot, FileText, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CompatibilityReportData } from "@/lib/ai";
import {
  LEGACY_LOCAL_LATEST_MEETING_KEY,
  LEGACY_LOCAL_PROXY_PROFILE_KEY,
  LOCAL_LATEST_MEETING_KEY,
  LOCAL_PROXY_PROFILE_KEY,
  type LocalMeetingSnapshot,
  type LocalProxyProfile
} from "@/lib/proxy-storage";

type TranscriptPreviewLine = {
  speaker: string;
  topic: string;
  content: string;
};

type MeetingRow = {
  a: string;
  b: string;
  status: string;
  time: string;
  score: string;
  href: string;
};

function ProxyBurst({ tone = "blue" }: { tone?: "blue" | "violet" }) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-ink">
      <svg width="30" height="20" viewBox="0 0 26 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7" stroke="hsl(40 33% 94%)" strokeWidth="1" opacity={tone === "blue" ? 0.92 : 0.6} />
        <circle cx="17" cy="9" r="7" stroke="hsl(350 30% 55%)" strokeWidth="1" opacity={tone === "blue" ? 0.92 : 0.6} />
      </svg>
    </div>
  );
}

function readLocalValue<T>(key: string, legacyKey?: string) {
  const value =
    window.localStorage.getItem(key) ??
    (legacyKey ? window.localStorage.getItem(legacyKey) : null);

  if (!value) return null;

  try {
    if (legacyKey && !window.localStorage.getItem(key)) {
      window.localStorage.setItem(key, value);
      window.localStorage.removeItem(legacyKey);
    }

    return JSON.parse(value) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function MeetingPreview({
  latestMeeting,
  transcriptPreview,
  profileName
}: {
  latestMeeting: LocalMeetingSnapshot | null;
  transcriptPreview: TranscriptPreviewLine[];
  profileName: string;
}) {
  const partnerName = latestMeeting?.participants.proxyBName ?? "No partner yet";
  const meetingId = latestMeeting?.id ?? "Preview";
  const sourceLabel =
    latestMeeting?.source === "openai"
      ? "OpenAI live"
      : latestMeeting
        ? "Preview"
        : "Preview";
  const lines =
    latestMeeting?.transcriptPreview.map((line) => ({
      speaker: line.speakerName,
      topic: line.topic,
      content: line.content
    })) ?? transcriptPreview.slice(0, 4);

  return (
    <section className="border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-light tracking-tightish">
            {latestMeeting ? "Latest introduction" : "Introduction preview"}
          </h2>
          <Badge tone={latestMeeting?.source === "openai" ? "blue" : "neutral"} className="mt-4">
            {sourceLabel}
          </Badge>
        </div>
        <p className="max-w-[180px] truncate text-right text-xs text-muted-foreground">
          Meeting ID: {meetingId}
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative flex min-h-48 w-full flex-col items-center justify-center gap-8 sm:flex-row sm:gap-0">
          <div className="absolute hidden h-px w-[44%] bg-border sm:block" />
          <div className="absolute hidden h-px w-[24%] translate-x-16 bg-claret sm:block" />
          <div className="absolute h-[58%] w-px bg-border sm:hidden" />
          <div className="absolute h-[28%] w-px translate-y-10 bg-claret sm:hidden" />
          <div className="flex flex-col items-center gap-3">
            <ProxyBurst />
            <div className="text-center">
              <p className="font-display text-sm">{profileName} AI</p>
              <p className="text-xs text-muted-foreground">Digital Representative</p>
            </div>
          </div>
          <div className="hidden w-32 sm:block" />
          <div className="flex flex-col items-center gap-3">
            <ProxyBurst tone="violet" />
            <div className="text-center">
              <p className="font-display text-sm">{partnerName} AI</p>
              <p className="text-xs text-muted-foreground">Digital Representative</p>
            </div>
          </div>
        </div>
        <Badge className="bg-muted text-foreground">
          {latestMeeting ? "Report ready" : "Discussing Values"}
        </Badge>
      </div>

      <div className="mt-8 space-y-4">
        {lines.map((line) => (
          <div key={`${line.speaker}-${line.content}`} className="grid gap-3 sm:grid-cols-[108px_1fr]">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span
                className={
                  line.speaker.startsWith(profileName)
                    ? "h-2 w-2 rounded-full bg-claret"
                    : "h-2 w-2 rounded-full bg-foreground"
                }
              />
              <span className="truncate">{line.speaker}</span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{line.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardHome({
  fallbackReport,
  fallbackTranscript
}: {
  fallbackReport: CompatibilityReportData;
  fallbackTranscript: TranscriptPreviewLine[];
}) {
  const [localProfile, setLocalProfile] = useState<LocalProxyProfile | null>(null);
  const [latestMeeting, setLatestMeeting] = useState<LocalMeetingSnapshot | null>(null);

  useEffect(() => {
    setLocalProfile(
      readLocalValue<LocalProxyProfile>(
        LOCAL_PROXY_PROFILE_KEY,
        LEGACY_LOCAL_PROXY_PROFILE_KEY
      )
    );
    setLatestMeeting(
      readLocalValue<LocalMeetingSnapshot>(
        LOCAL_LATEST_MEETING_KEY,
        LEGACY_LOCAL_LATEST_MEETING_KEY
      )
    );
  }, []);

  const profileName = localProfile?.name || "Hewie";
  const latestReport = latestMeeting?.report ?? fallbackReport;
  const latestHref = `/reports/${latestMeeting?.id ?? "demo"}` as Route;
  const partnerName = latestMeeting?.participants.proxyBName ?? "No partner yet";
  const meetingRows = useMemo<MeetingRow[]>(
    () =>
      latestMeeting
        ? [
            {
              a: `${profileName} AI`,
              b: `${partnerName} AI`,
              status: latestMeeting.source === "openai" ? "AI-generated" : "Preview",
              time: "Latest session",
              score: `${latestReport.overallScore}%`,
              href: latestHref
            }
          ]
        : [],
    [latestHref, latestMeeting, latestReport.overallScore, partnerName, profileName]
  );

  return (
    <div className="mx-auto max-w-7xl">
      <section className="border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <h1 className="font-display text-3xl font-light tracking-tightish">
              Welcome back, {profileName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here is what is happening with your Shadow.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/meetings">
              New introduction <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
          <div className="bg-background p-5">
            <p className="eyebrow text-muted-foreground">Your Shadow</p>
            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-xl font-light">{profileName} AI</p>
                <Link href="/dashboard/my-shadow" className="link-underline mt-2 inline-flex text-xs text-claret">
                  View profile
                </Link>
              </div>
              <ProxyBurst />
            </div>
          </div>
          <div className="bg-background p-5">
            <p className="eyebrow text-muted-foreground">Introductions</p>
            <p className="mt-6 font-display text-4xl font-light tracking-tighter2">{latestMeeting ? "1" : "0"}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {latestMeeting ? "Saved this session" : "No real meetings yet"}
            </p>
          </div>
          <div className="bg-background p-5">
            <p className="eyebrow text-muted-foreground">Compatibility</p>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="font-display text-4xl font-light tracking-tighter2">{latestReport.overallScore}%</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {latestMeeting ? "Latest score" : "Average score"}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full border-2 border-claret border-l-border" />
            </div>
          </div>
        </div>

        <section className="mt-8 border border-border">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-light">Recent introductions</h2>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/meetings">View all</Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {meetingRows.length > 0 ? (
              meetingRows.map((meeting) => (
                <Link
                  key={`${meeting.a}-${meeting.b}-${meeting.time}`}
                  href={meeting.href as Route}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-4">
                    <span className="h-2 w-2 rounded-full bg-claret" />
                    <div>
                      <p className="text-sm font-medium">
                        {meeting.a} <span className="mx-2 text-muted-foreground">×</span>{" "}
                        {meeting.b}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {meeting.status} · {meeting.time}
                      </p>
                    </div>
                  </div>
                  <p className="font-display text-xl font-light">{meeting.score}</p>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8">
                <p className="text-sm font-medium">No recent introductions yet.</p>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  Invite someone from Introductions. Once their Shadow accepts, the
                  meeting and reading will appear here.
                </p>
                <Button asChild className="mt-5" size="sm">
                  <Link href="/dashboard/meetings">
                    Create invite <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <MeetingPreview
          latestMeeting={latestMeeting}
          transcriptPreview={fallbackTranscript}
          profileName={profileName}
        />
        <section className="grid gap-6">
          <div className="border border-border bg-card p-6">
            <Bot className="h-5 w-5 text-claret" />
            <h2 className="mt-5 font-display text-lg font-light">My Shadow</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {localProfile
                ? `${profileName} AI is built from ${localProfile.selectedSignalCount} guided signals and ${localProfile.importWordCount} imported words.`
                : "Add LLM context, journals, or social writing to make the representative less generic."}
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link href="/dashboard/my-shadow">Review profile</Link>
            </Button>
          </div>
          <div className="bg-ink p-6 text-paper">
            <FileText className="h-5 w-5 text-paper/70" />
            <h2 className="mt-5 font-display text-lg font-light">The reading</h2>
            <p className="mt-2 text-sm leading-6 text-paper/65">
              {latestMeeting
                ? "The latest compatibility reading is saved locally and ready to share."
                : "The latest compatibility reading is ready to share or export."}
            </p>
            <div className="mt-5 flex items-center justify-between">
              <p className="font-display text-5xl font-light tracking-tighter2">{latestReport.overallScore}%</p>
              <MessageSquare className="h-6 w-6 text-paper/40" />
            </div>
            <Button
              asChild
              className="mt-5 bg-paper text-ink hover:bg-paper/90"
            >
              <Link href={latestHref}>Open reading</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
