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
    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-ink">
      <svg width="44" height="30" viewBox="0 0 26 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7" stroke="hsl(40 33% 94%)" strokeWidth="1" opacity="0.9" />
        <circle cx="17" cy="9" r="7" stroke="hsl(350 30% 55%)" strokeWidth="1" opacity="0.7" />
      </svg>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="eyebrow text-muted-foreground">{title}</h3>
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
          className="border border-border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground"
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
    <section className="border border-border bg-card">
      <div className="border-b border-border p-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <h1 className="font-display text-2xl font-light tracking-tightish">My Shadow</h1>
            <div className="mt-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={cn(
                    "h-9 rounded-full border border-transparent px-4 text-sm transition-colors hover:border-border hover:text-foreground",
                    activeTab === tab &&
                      "border-foreground bg-foreground text-background hover:border-foreground hover:text-background"
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
          <h2 className="font-display text-lg font-light">Shadow Profile</h2>
          <Button asChild variant="secondary" size="sm">
            <Link href="/create-shadow">
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>

        <div className="mt-5 bg-ink p-6 text-paper">
          <div className="grid gap-6 md:grid-cols-[120px_1fr] md:items-center">
            <ProxyBurst />
            <div>
              <p className="font-display text-xl font-light">{profileName} AI</p>
              <p className="mt-1 text-sm text-paper/60">Digital Representative</p>
              <p className="mt-4 max-w-xl text-sm leading-6 text-paper/75">
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
                      className="border border-border bg-background px-4 py-3"
                    >
                      <p className="eyebrow text-muted-foreground">{label}</p>
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
              <section key={title} className="border border-border p-5">
                <FileText className="h-5 w-5 text-claret" />
                <h3 className="mt-4 font-display text-base font-light">{title}</h3>
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
              <div key={event} className="flex items-center gap-3 border border-border p-4">
                <Activity className="h-4 w-4 text-claret" />
                <p className="text-sm text-muted-foreground">{event}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
