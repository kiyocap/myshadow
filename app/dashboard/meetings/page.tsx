"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  MapPin,
  Moon,
  Plus,
  Sparkles
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LEGACY_LOCAL_PROXY_PROFILE_KEY,
  LOCAL_PROXY_PROFILE_KEY,
  type LocalProxyProfile
} from "@/lib/proxy-storage";
import { activeTopics } from "@/lib/preview-data";
import { nearbyMatches } from "@/lib/discover-data";

const INVITE_CODE_KEY = "shadow.inviteCode.v1";

function useLocalShadow() {
  const [profile, setProfile] = useState<LocalProxyProfile | null>(null);
  const [code, setCode] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem(LOCAL_PROXY_PROFILE_KEY) ||
        window.localStorage.getItem(LEGACY_LOCAL_PROXY_PROFILE_KEY);
      if (raw) setProfile(JSON.parse(raw) as LocalProxyProfile);

      let existing = window.localStorage.getItem(INVITE_CODE_KEY);
      if (!existing) {
        existing = `PX-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        window.localStorage.setItem(INVITE_CODE_KEY, existing);
      }
      setCode(existing);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  return { profile, code, loaded };
}

function InviteLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const link = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://shadow.to";
    return `${origin}/invite/${code}`;
  }, [code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = link;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="grid min-w-0 gap-3 border border-border bg-background p-4 sm:flex sm:items-center sm:justify-between">
      <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs sm:pr-2 sm:text-sm">
        {link}
      </span>
      <Button
        variant="secondary"
        size="sm"
        className="w-full sm:w-auto"
        onClick={copy}
        type="button"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}

export default function MeetingsPage() {
  const { profile, code, loaded } = useLocalShadow();
  const hasShadow = Boolean(profile);
  const shadowName = profile?.name || "Your Shadow";

  // A few nearby shadows your shadow already got on with — invite them directly.
  const invitable = nearbyMatches.slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-7xl overflow-hidden">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="min-w-0">
          <Badge tone="blue">Introductions</Badge>
          <h1 className="mt-5 max-w-full font-display text-3xl font-light leading-tight tracking-tightish sm:text-4xl">
            Send your shadow to meet someone
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Share a private link, or send your shadow to meet someone it already
            got on with. Two representatives talk first — you read the result.
          </p>
        </div>
        {loaded && !hasShadow ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/create-shadow">
              <Plus className="h-4 w-4" /> Create Shadow
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full md:w-auto">
            <Link href="/meeting/demo">
              <Sparkles className="h-4 w-4" /> Start a meeting
            </Link>
          </Button>
        )}
      </div>

      {/* No shadow yet */}
      {loaded && !hasShadow && (
        <div className="mt-10 border border-dashed border-border bg-card p-8 text-center">
          <p className="font-display text-2xl font-light">Build your shadow first</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Your shadow needs a personality before it can meet anyone. It takes a
            couple of minutes — then this page fills with people to meet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/create-shadow">
              Create your shadow <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Has shadow */}
      {hasShadow && (
        <section className="mt-10 grid min-w-0 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Invite by link */}
          <div className="min-w-0 border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-light">Invite anyone</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send this link to anyone. When they accept and build their own
                  shadow, the two representatives meet and you both get a reading.
                </p>
              </div>
              <Badge tone="blue">Ready</Badge>
            </div>

            <div className="mt-6">
              <p className="eyebrow text-muted-foreground">{shadowName}&apos;s invite link</p>
              <div className="mt-3">
                <InviteLink code={code} />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/meeting/demo">
                  Watch a sample meeting <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              No one meets a placeholder. Your match signs in, builds a shadow, and
              accepts — then the conversation begins.
            </p>
          </div>

          {/* Invite a nearby shadow */}
          <div className="min-w-0 border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-light">Invite a shadow to meet</h2>
              <Link
                href="/dashboard/discover"
                className="text-xs text-claret hover:underline"
              >
                See all
              </Link>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Shadows in your area worth an introduction. Send yours in to talk.
            </p>

            <div className="mt-5 space-y-3">
              {invitable.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between gap-3 border border-border bg-background p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border font-display text-sm">
                      {match.score}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-light">
                        {match.name}, {match.age}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {match.location} · {match.distanceMiles} mi
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/dashboard/field/${match.id}`}>
                      <Moon className="h-3.5 w-3.5" /> Meet
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Topic coverage */}
      <section className="mt-6 min-w-0 border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-light">What they talk about</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every introduction moves through the dimensions that actually decide a relationship.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {activeTopics.map((topic) => (
            <div key={topic.topic} className="border border-border p-4">
              <div className="flex items-center gap-2">
                <span
                  className={
                    topic.status === "complete"
                      ? "h-2 w-2 rounded-full bg-claret"
                      : topic.status === "active"
                        ? "h-2 w-2 rounded-full bg-foreground"
                        : "h-2 w-2 rounded-full bg-muted"
                  }
                />
                <p className="text-sm font-medium">{topic.topic}</p>
              </div>
              <p className="mt-3 text-xs capitalize text-muted-foreground">{topic.status}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
