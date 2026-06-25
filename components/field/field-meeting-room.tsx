"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Pause, Play, RefreshCw, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LEGACY_LOCAL_PROXY_PROFILE_KEY,
  LOCAL_PROXY_PROFILE_KEY,
  type LocalProxyProfile
} from "@/lib/proxy-storage";
import {
  STAGE_LABELS,
  type ExchangeMessage,
  type MeetingMemory,
  type MeetingStage,
  type PreScreenResult,
  type ShadowMatchReport
} from "@/lib/field/types";

type FieldMeetingResponse = {
  source: "openai" | "demo";
  preScreen: PreScreenResult;
  stageResults: Array<{ stage: MeetingStage; exchange: ExchangeMessage[] }>;
  memory: MeetingMemory;
  report: ShadowMatchReport;
  participants: {
    userName: string;
    candidateName: string;
    candidate: { id: string; name: string; age: number; occupation: string; location: string };
  };
};

const STATUS_TONE: Record<ShadowMatchReport["recommendationStatus"], "blue" | "dark" | "neutral"> = {
  recommended: "dark",
  needs_follow_up: "blue",
  not_recommended: "neutral",
  insufficient_data: "neutral"
};

const STATUS_LABEL: Record<ShadowMatchReport["recommendationStatus"], string> = {
  recommended: "Recommended",
  needs_follow_up: "Needs follow-up",
  not_recommended: "Not recommended",
  insufficient_data: "Needs more data"
};

function readLocalProfile(): LocalProxyProfile | null {
  try {
    const raw =
      window.localStorage.getItem(LOCAL_PROXY_PROFILE_KEY) ||
      window.localStorage.getItem(LEGACY_LOCAL_PROXY_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as LocalProxyProfile) : null;
  } catch {
    return null;
  }
}

function ScoreBar({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">{label}</p>
        <p className="font-display text-2xl font-light">{value}</p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-claret"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function FieldMeetingRoom({ candidateId }: { candidateId: string }) {
  const [data, setData] = useState<FieldMeetingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsShadow, setNeedsShadow] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);
      setVisibleCount(0);

      const localProfile = readLocalProfile();
      if (!localProfile) {
        setNeedsShadow(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/field/meet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId, localProfile }),
          signal: controller.signal
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "The meeting could not start.");
        }
        const json = (await response.json()) as FieldMeetingResponse;
        setData(json);
        setVisibleCount(1);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Meeting failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    run();
    return () => controller.abort();
  }, [candidateId, runId]);

  const transcript = useMemo(
    () => data?.stageResults.flatMap((s) => s.exchange) ?? [],
    [data]
  );

  useEffect(() => {
    if (!playing || loading || transcript.length === 0) return;
    if (visibleCount >= transcript.length) return;
    const interval = window.setInterval(() => {
      setVisibleCount((c) => Math.min(c + 1, transcript.length));
    }, 1600);
    return () => window.clearInterval(interval);
  }, [playing, loading, transcript.length, visibleCount]);

  const visible = transcript.slice(0, visibleCount);
  const currentStage = visible.at(-1)?.stage ?? data?.stageResults[0]?.stage ?? "surface";
  const completed = Boolean(data && visibleCount >= transcript.length && !loading);
  const report = data?.report;
  const userName = data?.participants.userName ?? "Your Shadow";
  const candidateName = data?.participants.candidateName ?? "Their Shadow";
  const stagesRun = data?.stageResults.map((s) => s.stage) ?? [];

  if (needsShadow) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="border border-dashed border-border bg-card p-8 text-center">
          <p className="font-display text-2xl font-light">Build your shadow first</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Your shadow needs a personality before it can meet anyone.
          </p>
          <Button asChild className="mt-6">
            <Link href="/create-shadow">Create your shadow</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/meetings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <Badge tone="blue">
            {loading ? "Meeting in progress" : data?.source === "openai" ? "AI live" : "Preview"}
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTranscript((v) => !v)}
            disabled={loading || !data}
          >
            {showTranscript ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showTranscript ? "Hide transcript" : "Show transcript"}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => setPlaying((v) => !v)}
            disabled={loading || !data || !showTranscript}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Re-run meeting"
            onClick={() => setRunId((c) => c + 1)}
            disabled={loading}
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </div>

      <h1 className="mt-6 font-display text-3xl font-light leading-tight tracking-tightish sm:text-4xl">
        {userName} is meeting {candidateName}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Two representatives run a structured compatibility meeting before either of you
        spends a minute on a date. You read the result.
      </p>
      {error && (
        <p className="mt-4 max-w-xl border-l border-claret pl-3 text-sm leading-6 text-muted-foreground">
          {error}
        </p>
      )}

      <section
        className={
          "mt-8 grid min-w-0 gap-6 " +
          (showTranscript ? "xl:grid-cols-[1fr_1.05fr]" : "max-w-3xl")
        }
      >
        {/* Live transcript */}
        {showTranscript && (
        <div className="min-w-0 border border-border bg-card p-5 sm:p-6">
          {/* Two-orb animation */}
          <div className="relative flex min-h-[140px] items-center justify-center gap-10 overflow-hidden border-b border-border pb-6">
            <div className="absolute h-px w-[55%] bg-border" />
            <motion.div
              className="absolute h-px w-[55%] origin-left bg-claret"
              animate={{ scaleX: loading ? [0.12, 0.5, 0.12] : [0.16, 1, 0.16], opacity: [0.2, 1, 0.2] }}
              transition={{ duration: loading ? 1.5 : 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="z-10 flex h-20 w-20 items-center justify-center rounded-full border border-foreground bg-card text-center text-xs"
              animate={{ x: [-6, 0, -6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {userName}
            </motion.div>
            <motion.div
              className="z-10 flex h-20 w-20 items-center justify-center rounded-full border border-claret bg-card text-center text-xs text-claret"
              animate={{ x: [6, 0, 6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {candidateName}
            </motion.div>
          </div>

          {/* Stage progress */}
          <div className="mt-5 flex flex-wrap gap-2">
            {(Object.keys(STAGE_LABELS) as MeetingStage[]).map((stage) => {
              const ran = stagesRun.includes(stage);
              const active = stage === currentStage && !completed;
              return (
                <span
                  key={stage}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] " +
                    (active
                      ? "border-foreground text-foreground"
                      : ran
                        ? "border-claret/40 text-claret"
                        : "border-border text-muted-foreground")
                  }
                >
                  <span
                    className={
                      "h-1.5 w-1.5 rounded-full " +
                      (active ? "bg-foreground" : ran ? "bg-claret" : "bg-muted")
                    }
                  />
                  {STAGE_LABELS[stage]}
                </span>
              );
            })}
          </div>

          <div className="mt-6 max-h-[58vh] space-y-4 overflow-y-auto pr-2">
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-l border-border pl-4">
                  <div className="h-3 w-28 bg-muted" />
                  <div className="mt-3 h-3 w-full bg-muted" />
                  <div className="mt-2 h-3 w-4/5 bg-muted" />
                </div>
              ))}

            {!loading &&
              visible.map((line, index) => (
                <motion.div
                  key={`${index}-${line.speakerLabel}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-l border-border pl-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        line.speaker === data?.memory.userAId
                          ? "h-2 w-2 rounded-full bg-foreground"
                          : "h-2 w-2 rounded-full bg-claret"
                      }
                    />
                    <p className="text-sm font-medium">{line.speakerLabel}</p>
                    <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {line.intent}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {STAGE_LABELS[line.stage]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{line.content}</p>
                </motion.div>
              ))}
          </div>
        </div>
        )}

        {/* Report */}
        <aside className="min-w-0 border border-border bg-card p-5 sm:p-6">
          {report ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Badge tone={STATUS_TONE[report.recommendationStatus]}>
                    {STATUS_LABEL[report.recommendationStatus]}
                  </Badge>
                  <h2 className="mt-4 font-display text-2xl font-light leading-snug">
                    {report.headline}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{report.summary}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <ScoreBar
                  label="Compatibility"
                  value={report.compatibilityScore}
                  hint="How promising the match looks"
                />
                <ScoreBar
                  label="Confidence"
                  value={report.confidenceScore}
                  hint="How much your Shadow actually knows"
                />
              </div>

              <ReportList title="Why your Shadow picked them" items={report.whyYourShadowPickedThem} />
              <ReportList title="Where you align" items={report.areasOfAlignment} />
              <ReportList title="Where it could rub" items={report.potentialFriction} />
              <ReportList title="Ask in person" items={report.questionsToAskInPerson} />
              <ReportList title="Don't overdo" items={report.whatNotToOverdo} />

              {report.suggestedFirstDate && (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="eyebrow text-muted-foreground">Suggested first date</p>
                  <p className="mt-2 text-sm leading-6">{report.suggestedFirstDate}</p>
                  {report.locationConvenience && (
                    <p className="mt-1 text-xs text-muted-foreground">{report.locationConvenience}</p>
                  )}
                </div>
              )}

              {report.suggestedFirstMessage && (
                <div className="mt-5 border-t border-border pt-5">
                  <p className="eyebrow text-muted-foreground">A way to open</p>
                  <p className="mt-2 border-l border-claret pl-3 text-sm italic leading-6 text-muted-foreground">
                    {report.suggestedFirstMessage}
                  </p>
                </div>
              )}

              {report.whatYourShadowStillNeedsToKnow.length > 0 && (
                <ReportList
                  title="What your Shadow still needs to know"
                  items={report.whatYourShadowStillNeedsToKnow}
                />
              )}

              {data && data.memory.privacyBoundariesHit.length > 0 && (
                <p className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-claret" />
                  Sensitive details were kept private — your Shadow only shared high-level
                  patterns ({data.memory.privacyBoundariesHit.length} protected).
                </p>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="h-7 w-40 bg-muted" />
              <div className="h-8 w-3/4 bg-muted" />
              <div className="h-20 w-full bg-muted" />
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-6">
      <p className="eyebrow text-muted-foreground">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-claret" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
