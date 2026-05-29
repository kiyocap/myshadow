"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { ArrowRight, Pause, Play, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AIMeetingResult, MeetingTranscriptMessage } from "@/lib/ai";
import {
  LEGACY_LOCAL_LATEST_MEETING_KEY,
  LOCAL_LATEST_MEETING_KEY,
  type LocalMeetingSnapshot
} from "@/lib/proxy-storage";

const topics = [
  "Identity",
  "Values",
  "Lifestyle",
  "Money",
  "Family",
  "Communication",
  "Conflict",
  "Ambition",
  "Long-Term Goals"
] as const;

function getTopicStatus(
  topic: string,
  currentTopic: string,
  visibleTranscript: MeetingTranscriptMessage[]
) {
  const topicIndex = topics.indexOf(topic as (typeof topics)[number]);
  const currentIndex = topics.indexOf(currentTopic as (typeof topics)[number]);
  const hasVisibleMessage = visibleTranscript.some((message) => message.topic === topic);

  if (topicIndex < currentIndex || (hasVisibleMessage && topic !== currentTopic)) {
    return "complete";
  }

  if (topic === currentTopic) {
    return "active";
  }

  return "queued";
}

export function MeetingRoom({ meetingId }: { meetingId: string }) {
  const [meeting, setMeeting] = useState<AIMeetingResult | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function runMeeting() {
      setLoading(true);
      setError(null);
      setVisibleCount(0);

      try {
        const response = await fetch("/api/meetings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            meetingId
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Meeting generation failed.");
        }

        const data = (await response.json()) as AIMeetingResult & {
          warning?: string;
        };

        setMeeting(data);
        setVisibleCount(1);

        if (data.warning) {
          setError(
            "Live generation was unavailable, so Shadow is showing a preview transcript. Try regenerating in a moment."
          );
        }
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Meeting generation failed."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    runMeeting();

    return () => controller.abort();
  }, [meetingId, runId]);

  useEffect(() => {
    if (!playing || !meeting || loading) return;
    if (visibleCount >= meeting.transcript.length) return;

    const interval = window.setInterval(() => {
      setVisibleCount((current) =>
        Math.min(current + 1, meeting.transcript.length)
      );
    }, 1900);

    return () => window.clearInterval(interval);
  }, [loading, meeting, playing, visibleCount]);

  useEffect(() => {
    if (!meeting) return;

    const snapshot: LocalMeetingSnapshot = {
      id: meeting.id,
      source: meeting.source,
      participants: {
        proxyAName: meeting.participants.proxyA.name,
        proxyBName: meeting.participants.proxyB.name
      },
      report: meeting.report,
      transcriptPreview: meeting.transcript.slice(0, 6),
      updatedAt: new Date().toISOString()
    };

    try {
      window.localStorage.setItem(
        LOCAL_LATEST_MEETING_KEY,
        JSON.stringify(snapshot)
      );
      window.localStorage.removeItem(LEGACY_LOCAL_LATEST_MEETING_KEY);
    } catch {
      // Local persistence is a convenience layer; the server cache still owns the live session.
    }
  }, [meeting]);

  const visibleTranscript = useMemo(
    () => meeting?.transcript.slice(0, visibleCount) ?? [],
    [meeting, visibleCount]
  );

  const currentTopic = visibleTranscript.at(-1)?.topic ?? "Identity";
  const proxyAName = meeting?.participants.proxyA.name ?? "Hewie";
  const proxyBName = meeting?.participants.proxyB.name ?? "Invite partner";
  const reportHref = `/reports/${meeting?.id ?? meetingId}` as Route;
  const completed = Boolean(
    meeting && visibleCount >= meeting.transcript.length && !loading
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-5 sm:px-8">
        <Link href="/" className="text-sm font-semibold">
          Shadow
        </Link>
        <div className="flex items-center gap-2">
          <Badge tone="blue">
            {loading
              ? "Generating"
              : meeting?.source === "openai"
                ? "OpenAI live"
                : "Preview"}
          </Badge>
          <Button
            variant="secondary"
            size="icon"
            aria-label={playing ? "Pause meeting" : "Play meeting"}
            onClick={() => setPlaying((value) => !value)}
            disabled={loading || !meeting}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Regenerate meeting"
            onClick={() => setRunId((current) => current + 1)}
            disabled={loading}
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="order-2 border border-border bg-white p-5 sm:p-6 xl:order-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge tone={completed ? "blue" : "dark"}>
                {loading ? "Generating meeting" : completed ? "Meeting complete" : `Discussing ${currentTopic}`}
              </Badge>
              <h1 className="mt-5 text-4xl font-semibold">
                AI representatives meeting
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {proxyAName} AI and {proxyBName} AI are having a structured,
                transcript-first conversation across identity, values,
                lifestyle, money, family, communication, conflict, ambition, and
                long-term goals.
              </p>
              {error && (
                <p className="mt-4 max-w-xl border-l border-blue-600 pl-3 text-sm leading-6 text-muted-foreground">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="relative mt-8 flex min-h-[260px] flex-col items-center justify-center gap-8 overflow-hidden border-y border-border py-8 sm:mt-10 sm:min-h-[360px] sm:flex-row sm:gap-0 sm:py-0">
            <div className="absolute hidden h-px w-[62%] bg-blue-600/30 sm:block" />
            <div className="absolute h-[62%] w-px bg-blue-600/30 sm:hidden" />
            <motion.div
              className="absolute hidden h-px w-[62%] origin-left bg-blue-600 sm:block"
              animate={{ scaleX: loading ? [0.12, 0.5, 0.12] : [0.16, 1, 0.16], opacity: [0.24, 1, 0.24] }}
              transition={{ duration: loading ? 1.6 : 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute h-[62%] w-px origin-top bg-blue-600 sm:hidden"
              animate={{ scaleY: loading ? [0.12, 0.5, 0.12] : [0.16, 1, 0.16], opacity: [0.24, 1, 0.24] }}
              transition={{ duration: loading ? 1.6 : 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="z-10 flex h-28 w-28 items-center justify-center rounded-full border border-black bg-white text-center text-sm font-semibold shadow-quiet-xl sm:h-36 sm:w-36"
              animate={{ x: [-8, 0, -8], y: [0, -4, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            >
              {proxyAName} AI
            </motion.div>
            <motion.div
              className="z-10 flex h-28 w-28 items-center justify-center rounded-full border border-blue-600 bg-white text-center text-sm font-semibold text-blue-700 shadow-quiet-xl sm:ml-24 sm:h-36 sm:w-36"
              animate={{ x: [8, 0, 8], y: [0, 4, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            >
              {proxyBName} AI
            </motion.div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {topics.map((topic) => {
              const status = getTopicStatus(topic, currentTopic, visibleTranscript);

              return (
                <div key={topic} className="border border-border p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        status === "complete"
                          ? "h-2 w-2 rounded-full bg-blue-600"
                          : status === "active"
                            ? "h-2 w-2 rounded-full bg-black"
                            : "h-2 w-2 rounded-full bg-muted"
                      }
                    />
                    <p className="text-sm font-medium">{topic}</p>
                  </div>
                  <p className="mt-2 text-xs capitalize text-muted-foreground">
                    {status}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="order-1 border border-border bg-white p-5 sm:p-6 xl:order-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Live transcript</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                No black box. Every insight can be traced back to the meeting.
              </p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href={reportHref}>
                Report <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 max-h-[60vh] space-y-5 overflow-y-auto pr-2 sm:mt-8 xl:max-h-[640px]">
            {loading && (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="border-l border-border pl-4">
                    <div className="h-3 w-28 bg-muted" />
                    <div className="mt-3 h-3 w-full bg-muted" />
                    <div className="mt-2 h-3 w-4/5 bg-muted" />
                  </div>
                ))}
              </div>
            )}

            {!loading &&
              visibleTranscript.map((line, index) => (
                <motion.div
                  key={`${line.turn}-${line.speakerName}-${line.content}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-l border-border pl-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        line.speakerName.startsWith(proxyAName)
                          ? "h-2 w-2 rounded-full bg-blue-600"
                          : "h-2 w-2 rounded-full bg-violet-600"
                      }
                    />
                    <p className="text-sm font-medium">{line.speakerName}</p>
                    <span className="text-xs text-muted-foreground">{line.topic}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {line.content}
                  </p>
                </motion.div>
              ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
