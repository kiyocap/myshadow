"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Download, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CompatibilityReportData } from "@/lib/ai";
import {
  LEGACY_LOCAL_LATEST_MEETING_KEY,
  LOCAL_LATEST_MEETING_KEY,
  type LocalMeetingSnapshot
} from "@/lib/proxy-storage";

function readLatestMeeting() {
  const value =
    window.localStorage.getItem(LOCAL_LATEST_MEETING_KEY) ??
    window.localStorage.getItem(LEGACY_LOCAL_LATEST_MEETING_KEY);

  if (!value) return null;

  try {
    if (!window.localStorage.getItem(LOCAL_LATEST_MEETING_KEY)) {
      window.localStorage.setItem(LOCAL_LATEST_MEETING_KEY, value);
      window.localStorage.removeItem(LEGACY_LOCAL_LATEST_MEETING_KEY);
    }

    return JSON.parse(value) as LocalMeetingSnapshot;
  } catch {
    window.localStorage.removeItem(LOCAL_LATEST_MEETING_KEY);
    return null;
  }
}

export function ReportsArchive({
  fallbackReport
}: {
  fallbackReport: CompatibilityReportData;
}) {
  const [latestMeeting, setLatestMeeting] = useState<LocalMeetingSnapshot | null>(null);

  useEffect(() => {
    setLatestMeeting(readLatestMeeting());
  }, []);

  const report = latestMeeting?.report ?? fallbackReport;
  const href = `/reports/${latestMeeting?.id ?? "demo"}` as Route;
  const partnerLabel = latestMeeting
    ? `${latestMeeting.participants.proxyAName} AI x ${latestMeeting.participants.proxyBName} AI`
    : "No completed meeting yet";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Badge tone="blue">Reports</Badge>
          <h1 className="mt-5 text-4xl font-semibold">Compatibility insight archive</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Reports are saved with category scores, transcript evidence, share
            cards, and export controls.
          </p>
        </div>
        <Button asChild>
          <Link href={href}>
            Open latest <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <section className="mt-10 border border-border bg-white p-6">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">{partnerLabel}</p>
              {latestMeeting && (
                <Badge tone={latestMeeting.source === "openai" ? "blue" : "neutral"}>
                  {latestMeeting.source === "openai" ? "AI-generated" : "Preview"}
                </Badge>
              )}
            </div>
            <h2 className="mt-3 text-3xl font-semibold">What Your AIs Learned</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {report.relationshipOutlook}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border border-border p-5">
              <p className="text-sm text-muted-foreground">Overall</p>
              <p className="mt-3 text-4xl font-semibold">{report.overallScore}%</p>
            </div>
            <Button asChild variant="secondary" className="h-full min-h-28 flex-col">
              <Link href={href}>
                <Share2 className="h-5 w-5" />
                Share tools
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-full min-h-28 flex-col">
              <Link href={href}>
                <Download className="h-5 w-5" />
                Export PDF
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Communication", report.communication],
          ["Lifestyle", report.lifestyle],
          ["Values", report.values]
        ].map(([label, score]) => (
          <div key={label as string} className="border border-border bg-white p-5">
            <p className="text-sm text-muted-foreground">{label as string}</p>
            <p className="mt-3 text-3xl font-semibold">{score as number}%</p>
          </div>
        ))}
      </section>
    </div>
  );
}
