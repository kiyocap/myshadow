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
  const accent = tone === "blue" ? "#2563eb" : "#8b5cf6";

  return (
    <div
      className="relative h-16 w-16 rounded-full bg-black"
      style={{ boxShadow: `0 0 26px ${accent}35` }}
    >
      <span
        className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: accent, boxShadow: `0 0 18px ${accent}` }}
      />
      {Array.from({ length: 4 }).map((_, index) => (
        <span
          key={index}
          className="absolute rounded-full border"
          style={{
            inset: `${6 + index * 7}px`,
            borderColor: `${accent}30`
          }}
        />
      ))}
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
    <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {latestMeeting ? "Latest AI Meeting" : "AI Meeting Preview"}
          </h2>
          <Badge
            className={
              latestMeeting?.source === "openai"
                ? "mt-4 border-blue-200 bg-blue-50 text-blue-700"
                : "mt-4 border-emerald-200 bg-emerald-50 text-emerald-700"
            }
          >
            {sourceLabel}
          </Badge>
        </div>
        <p className="max-w-[180px] truncate text-right text-xs text-muted-foreground">
          Meeting ID: {meetingId}
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative flex min-h-48 w-full flex-col items-center justify-center gap-8 sm:flex-row sm:gap-0">
          <div className="absolute hidden h-px w-[44%] bg-blue-600/25 sm:block" />
          <div className="absolute hidden h-px w-[24%] translate-x-16 bg-blue-600 sm:block" />
          <div className="absolute h-[58%] w-px bg-blue-600/25 sm:hidden" />
          <div className="absolute h-[28%] w-px translate-y-10 bg-blue-600 sm:hidden" />
          <div className="flex flex-col items-center gap-3">
            <ProxyBurst />
            <div className="text-center">
              <p className="font-semibold">{profileName} AI</p>
              <p className="text-xs text-muted-foreground">Digital Representative</p>
            </div>
          </div>
          <div className="hidden w-32 sm:block" />
          <div className="flex flex-col items-center gap-3">
            <ProxyBurst tone="violet" />
            <div className="text-center">
              <p className="font-semibold">{partnerName} AI</p>
              <p className="text-xs text-muted-foreground">Digital Representative</p>
            </div>
          </div>
        </div>
        <Badge className="border-border bg-muted text-foreground">
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
                    ? "h-2 w-2 rounded-full bg-blue-600"
                    : "h-2 w-2 rounded-full bg-violet-600"
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
      <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Welcome back, {profileName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here is what is happening with your Shadow.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/meetings">
              New meeting <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border p-5">
            <p className="text-xs text-muted-foreground">Your Shadow</p>
            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xl font-semibold">{profileName} AI</p>
                <Link href="/dashboard/my-shadow" className="mt-2 block text-xs text-blue-700">
                  View profile
                </Link>
              </div>
              <ProxyBurst />
            </div>
          </div>
          <div className="rounded-lg border border-border p-5">
            <p className="text-xs text-muted-foreground">AI Meetings</p>
            <p className="mt-6 text-3xl font-semibold">{latestMeeting ? "1" : "0"}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {latestMeeting ? "Saved this session" : "No real meetings yet"}
            </p>
          </div>
          <div className="rounded-lg border border-border p-5">
            <p className="text-xs text-muted-foreground">Compatibility</p>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-semibold">{latestReport.overallScore}%</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {latestMeeting ? "Latest score" : "Average score"}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full border-4 border-blue-600 border-l-muted" />
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-lg border border-border">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Recent AI Meetings</h2>
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
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.8)]" />
                    <div>
                      <p className="text-sm font-medium">
                        {meeting.a} <span className="mx-2 text-muted-foreground">x</span>{" "}
                        {meeting.b}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {meeting.status} · {meeting.time}
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-semibold">{meeting.score}</p>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8">
                <p className="text-sm font-medium">No recent AI meetings yet.</p>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  Invite someone from AI Meetings. Once their Shadow accepts, the real
                  meeting and report will appear here.
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
          <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
            <Bot className="h-5 w-5 text-blue-600" />
            <h2 className="mt-5 text-lg font-semibold">My Shadow</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {localProfile
                ? `${profileName} AI is built from ${localProfile.selectedSignalCount} guided signals and ${localProfile.importWordCount} imported words.`
                : "Add LLM context, journals, or social writing to make the representative less generic."}
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link href="/dashboard/my-shadow">Review profile</Link>
            </Button>
          </div>
          <div className="rounded-lg border border-black bg-black p-6 text-white shadow-sm">
            <FileText className="h-5 w-5 text-blue-300" />
            <h2 className="mt-5 text-lg font-semibold">What Your AIs Learned</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              {latestMeeting
                ? "The latest compatibility report is saved locally and ready to share."
                : "The latest compatibility report is ready to share or export."}
            </p>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-5xl font-semibold">{latestReport.overallScore}%</p>
              <MessageSquare className="h-6 w-6 text-white/40" />
            </div>
            <Button
              asChild
              variant="secondary"
              className="mt-5 border-white/20 bg-white text-black hover:bg-white/90"
            >
              <Link href={latestHref}>Open report</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
