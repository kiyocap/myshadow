"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Edit3, FileText, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GeneratedProxyProfile } from "@/lib/ai";
import {
  LEGACY_LOCAL_PROXY_PROFILE_KEY,
  LOCAL_PROXY_PROFILE_KEY,
  type LocalProxyProfile
} from "@/lib/proxy-storage";
import { cn } from "@/lib/utils";

const tabs = ["Profile", "Personality", "Imports", "Activity"] as const;

function ProxyBurst() {
  return (
    <div className="relative h-24 w-24 rounded-full border border-blue-500/20 bg-black">
      <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 shadow-[0_0_24px_rgba(37,99,235,0.9)]" />
      {Array.from({ length: 6 }).map((_, index) => (
        <span
          key={index}
          className="absolute rounded-full border border-blue-500/25"
          style={{ inset: `${8 + index * 7}px` }}
        />
      ))}
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <p
          key={item}
          className="rounded-lg border border-border bg-[#fafafa] px-4 py-3 text-sm leading-6 text-muted-foreground"
        >
          {item}
        </p>
      ))}
    </div>
  );
}

export function ProxyProfilePanel({ profile }: { profile: GeneratedProxyProfile }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Profile");
  const [localProfile, setLocalProfile] = useState<LocalProxyProfile | null>(null);
  const displayProfile = localProfile?.profile ?? profile;
  const profileName = localProfile?.name || "Hewie";
  const importWordCount = localProfile?.importWordCount ?? 0;
  const selectedSignalCount = localProfile?.selectedSignalCount ?? 0;
  const bioSignals = useMemo(
    () =>
      [
        ["Age", localProfile?.age?.toString()],
        ["Occupation", localProfile?.occupation],
        ["Location", localProfile?.location],
        ["Star sign", localProfile?.starSign],
        ["Myers-Briggs", localProfile?.myersBriggs]
      ].filter(([, value]) => value),
    [localProfile]
  );
  const guidedAnswerSummary = useMemo(() => {
    const answers = localProfile?.guidedAnswers ?? {};

    return {
      motivation: answers.motivation?.join(", "),
      frustrations: answers.frustrations?.join(", ")
    };
  }, [localProfile]);

  useEffect(() => {
    const stored =
      window.localStorage.getItem(LOCAL_PROXY_PROFILE_KEY) ??
      window.localStorage.getItem(LEGACY_LOCAL_PROXY_PROFILE_KEY);

    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as LocalProxyProfile;

      if (parsed?.profile?.summary && parsed.name) {
        setLocalProfile(parsed);
        window.localStorage.setItem(LOCAL_PROXY_PROFILE_KEY, stored);
        window.localStorage.removeItem(LEGACY_LOCAL_PROXY_PROFILE_KEY);
      }
    } catch {
      window.localStorage.removeItem(LOCAL_PROXY_PROFILE_KEY);
    }
  }, []);

  return (
    <section className="rounded-lg border border-border bg-white shadow-sm">
      <div className="border-b border-border p-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold">My Shadow</h1>
            <div className="mt-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={cn(
                    "h-10 rounded-md border border-transparent px-3 transition-colors hover:border-border hover:bg-muted hover:text-foreground",
                    activeTab === tab &&
                      "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  )}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/create-shadow">
              <Upload className="h-4 w-4" />
              Improve
            </Link>
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Shadow Profile</h2>
          <Button asChild variant="secondary" size="sm">
            <Link href="/create-shadow">
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>

        <div className="mt-5 rounded-lg border border-black bg-black p-6 text-white">
          <div className="grid gap-6 md:grid-cols-[120px_1fr] md:items-center">
            <ProxyBurst />
            <div>
              <p className="text-xl font-semibold">{profileName} AI</p>
              <p className="mt-1 text-sm text-white/60">Digital Representative</p>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">
                {displayProfile.summary}
              </p>
            </div>
          </div>
        </div>

        {activeTab === "Profile" && (
          <div className="mt-6 space-y-6">
            {bioSignals.length > 0 && (
              <DetailSection title="Bio Signals">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {bioSignals.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border bg-[#fafafa] px-4 py-3"
                    >
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}
            <DetailSection title="Core Traits">
              <div className="flex flex-wrap gap-2">
                {displayProfile.traits.slice(0, 5).map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
            </DetailSection>
            <DetailSection title="Communication Style">
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {displayProfile.communicationStyle}
              </p>
            </DetailSection>
            <div className="grid gap-6 md:grid-cols-2">
              <DetailSection title="What motivates you">
                <p className="text-sm leading-6 text-muted-foreground">
                  {guidedAnswerSummary.motivation ||
                    "Building, creating impact, protecting creative focus, and solving meaningful problems."}
                </p>
              </DetailSection>
              <DetailSection title="What frustrates you">
                <p className="text-sm leading-6 text-muted-foreground">
                  {guidedAnswerSummary.frustrations ||
                    "Small talk, inconsistency, vague effort, and unresolved ambiguity."}
                </p>
              </DetailSection>
            </div>
          </div>
        )}

        {activeTab === "Personality" && (
          <div className="mt-6 grid gap-6">
            <DetailSection title="Values">
              <TextList items={displayProfile.values} />
            </DetailSection>
            <DetailSection title="Strengths">
              <TextList items={displayProfile.strengths} />
            </DetailSection>
            <DetailSection title="Weaknesses">
              <TextList items={displayProfile.weaknesses} />
            </DetailSection>
            <DetailSection title="Relationship Preferences">
              <TextList items={displayProfile.relationshipPreferences} />
            </DetailSection>
          </div>
        )}

        {activeTab === "Imports" && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              [
                "Guided answers",
                selectedSignalCount > 0 ? `${selectedSignalCount} signals` : "Ready",
                "Base personality signal"
              ],
              [
                "LLM Import",
                importWordCount > 0 ? `${importWordCount} words` : "Optional",
                "Paste a profile from your AI"
              ],
              ["Journal entries", "Optional", "Improve long-term retrieval"]
            ].map(([title, status, body]) => (
              <section key={title} className="rounded-lg border border-border p-5">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <Badge
                  tone={status !== "Optional" && status !== "Ready" ? "blue" : "neutral"}
                  className="mt-3"
                >
                  {status}
                </Badge>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{body}</p>
              </section>
            ))}
          </div>
        )}

        {activeTab === "Activity" && (
          <div className="mt-6 space-y-3">
            {[
              localProfile
                ? `${profileName} AI profile saved from Create Shadow`
                : "Preview Shadow profile loaded",
              "Latest AI meeting saved",
              "Compatibility report created",
              "Three first-date options generated"
            ].map((event) => (
              <div key={event} className="flex items-center gap-3 rounded-lg border border-border p-4">
                <Activity className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-muted-foreground">{event}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
