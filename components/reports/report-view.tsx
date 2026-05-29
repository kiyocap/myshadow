import Link from "next/link";
import { Eye, MapPin, MessageCircle, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DownloadPdfButton,
  ReportHeaderActions,
  ShareControls
} from "@/components/reports/report-actions";
import type { AIMeetingResult, CompatibilityReportData } from "@/lib/ai";

type ScoreItem = [label: string, score: number];

function getScores(report: CompatibilityReportData): ScoreItem[] {
  return [
    ["Communication", report.communication],
    ["Lifestyle", report.lifestyle],
    ["Values", report.values],
    ["Ambition", report.ambition],
    ["Emotional Fit", Math.round((report.values + report.conflictResolution) / 2)],
    ["Conflict Resolution", report.conflictResolution]
  ];
}

function RadarChart({ scores }: { scores: ScoreItem[] }) {
  const center = 130;
  const radius = 88;
  const points = scores.map(([, score], index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
    const scaledRadius = radius * (score / 100);
    return [
      center + Math.cos(angle) * scaledRadius,
      center + Math.sin(angle) * scaledRadius
    ];
  });
  const polygon = points.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <div className="relative mx-auto h-[320px] w-full max-w-[340px]">
      <svg viewBox="0 0 260 260" className="h-full w-full">
        {[24, 44, 64, 84].map((ring) => (
          <polygon
            key={ring}
            points={scores
              .map((_, index) => {
                const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
                return `${center + Math.cos(angle) * ring},${center + Math.sin(angle) * ring}`;
              })
              .join(" ")}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        {scores.map((_, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={center + Math.cos(angle) * radius}
              y2={center + Math.sin(angle) * radius}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}
        <polygon
          points={polygon}
          fill="rgba(37, 99, 235, 0.08)"
          stroke="#2563eb"
          strokeWidth="2"
        />
        {points.map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r="3" fill="#2563eb" />
        ))}
      </svg>
      {scores.map(([label, score], index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
        return (
          <div
            key={label}
            className="absolute w-24 text-center text-xs"
            style={{
              top: `${50 + Math.sin(angle) * 40}%`,
              left: `${50 + Math.cos(angle) * 34}%`,
              transform: "translate(-50%, -50%)"
            }}
          >
            <p>{label}</p>
            <p className="font-semibold">{score}</p>
          </div>
        );
      })}
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-border bg-white p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <p
            key={item}
            className="border-l border-blue-600 pl-3 text-sm leading-6 text-muted-foreground"
          >
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

function FirstDateOptions({
  options
}: {
  options: CompatibilityReportData["suggestedFirstDates"];
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          <MessageCircle className="mt-1 h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold">Suggested First Dates</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Three options selected around compatibility, interests, pace, and the
              most useful things to learn in person.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {options.map((option, index) => (
          <article
            key={option.title}
            className="flex min-h-[420px] flex-col rounded-lg border border-border p-5"
          >
            <Badge tone="blue" className="w-fit">
              Option {index + 1}
            </Badge>
            <h3 className="mt-4 text-xl font-semibold leading-tight">{option.title}</h3>

            <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
              <div className="flex gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                <p>{option.setting}</p>
              </div>
              <div className="flex gap-3">
                <Sparkles className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                <p>{option.bestFor}</p>
              </div>
              <p>{option.whyItFits}</p>
              <div className="flex gap-3">
                <Eye className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                <p>{option.whatToNotice}</p>
              </div>
              <p>{option.logistics}</p>
            </div>

            <div className="mt-auto pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Bring up
              </p>
              <div className="mt-3 space-y-2">
                {option.conversationPrompts.map((prompt) => (
                  <p
                    key={prompt}
                    className="rounded-md border border-border bg-muted px-3 py-2 text-sm leading-5"
                  >
                    {prompt}
                  </p>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ReportView({
  reportId,
  report,
  source
}: {
  reportId: string;
  report: CompatibilityReportData;
  source?: AIMeetingResult["source"];
}) {
  const scores = getScores(report);
  const sourceLabel =
    source === "openai" ? "AI-generated report" : reportId === "demo" ? "Preview report" : reportId;

  return (
    <main className="min-h-screen bg-[#f8f8f8]">
      <header className="flex h-16 items-center justify-between border-b border-border bg-white px-5 sm:px-8 print:hidden">
        <Link href="/" className="text-sm font-semibold">
          Shadow
        </Link>
        <div className="flex items-center gap-2">
          <Badge tone="blue">{sourceLabel}</Badge>
          <ReportHeaderActions report={report} />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-start">
            <div>
              <p className="text-sm text-muted-foreground">Compatibility Report</p>
              <h1 className="mt-2 text-2xl font-semibold">What Your AIs Learned</h1>
              <Button asChild variant="secondary" size="sm" className="mt-4 print:hidden">
                <Link href="/dashboard/meetings">Back to meetings</Link>
              </Button>
            </div>
            <DownloadPdfButton className="print:hidden" />
          </div>

          <div className="grid gap-10 py-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <p className="text-sm text-muted-foreground">Overall Compatibility</p>
              <p className="mt-4 text-7xl font-semibold">
                {report.overallScore}%
              </p>
              <p className="mt-4 font-semibold">Relationship Outlook</p>
              <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                {report.relationshipOutlook}
              </p>
            </div>
            <RadarChart scores={scores} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <ReportList title="Green Flags" items={report.greenFlags} />
          <ReportList
            title="Potential Friction"
            items={report.potentialFriction}
          />
          <ReportList
            title="Questions To Discuss"
            items={report.questionsToDiscuss}
          />
        </div>

        <div className="mt-6">
          <FirstDateOptions options={report.suggestedFirstDates} />
        </div>

        <section className="mt-6 rounded-lg border border-border bg-white p-6 print:hidden">
          <h2 className="text-lg font-semibold">Share Your Results</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create a share card</p>
          <div className="mt-6">
            <ShareControls report={report} />
          </div>
        </section>
      </section>
    </main>
  );
}
