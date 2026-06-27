import Link from "next/link";
import type { Route } from "next";
import { getServerSession } from "next-auth";
import { ArrowRight, Download, LockKeyhole, MessageCircle, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { ensureInviteForUser } from "@/lib/db-meetings";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await getServerSession(authOptions);
  const callbackUrl = `/invite/${encodeURIComponent(code)}`;
  const encodedCode = encodeURIComponent(code);
  const appDeepLink = `shadow://invite/${encodedCode}`;
  const appStoreUrl = "https://apps.apple.com/app/id6778405295";
  const inviteState = session?.user?.id
    ? await ensureInviteForUser(code, session.user.id).catch((error) => ({
        error:
          error instanceof Error && error.message === "INVITE_FULL"
            ? "This invite already has two Shadows connected."
            : "This invite could not be connected. Ask for a fresh invite link."
      }))
    : null;
  const hasShadow =
    inviteState && "needsShadow" in inviteState ? !inviteState.needsShadow : false;
  const isReady =
    inviteState && "isReady" in inviteState ? inviteState.isReady : false;
  const meetingHref =
    inviteState && "meetingId" in inviteState && inviteState.meetingId
      ? (`/meeting/${inviteState.meetingId}` as Route)
      : null;
  const participants =
    inviteState && "participants" in inviteState ? inviteState.participants : [];
  const inviteError = inviteState && "error" in inviteState ? inviteState.error : null;

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link aria-label="Shadow home" href="/">
          <div className="flex items-center gap-2.5">
            <svg width="24" height="16" viewBox="0 0 26 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.1" opacity="0.9" />
              <circle cx="17" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
            </svg>
            <span className="font-display text-lg font-medium tracking-tightish">Shadow</span>
          </div>
        </Link>
        {session?.user ? (
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="/dashboard">
            Dashboard
          </Link>
        ) : (
          <Link
            className="text-sm text-muted-foreground hover:text-foreground"
            href={`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          >
            Sign in
          </Link>
        )}
      </div>

      <section className="mx-auto mt-16 grid max-w-5xl gap-10 lg:min-h-[440px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div className="lg:pr-4">
          <Badge tone="blue">Private invite</Badge>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,5vw,3.75rem)] font-light leading-[1.04] tracking-tighter2">
            You&apos;ve been invited to let your minds meet first.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            Create your Shadow, consent to the introduction, and both
            representatives will compare values, lifestyle, communication,
            conflict, ambition, and long-term goals before you decide what
            deserves attention.
          </p>
          {inviteError ? (
            <p className="mt-8 border-l border-claret pl-3 text-sm leading-6 text-muted-foreground">
              {inviteError}
            </p>
          ) : null}
          <div className="mt-10 w-full max-w-[320px]">
            {!session?.user ? (
              <Button asChild size="lg" className="w-full whitespace-nowrap">
                <Link href={`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
                  Sign in to accept invite <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : !hasShadow ? (
              <Button asChild size="lg" className="w-full whitespace-nowrap">
                <Link href={`/create-shadow?invite=${code}`}>
                  Create your Shadow <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : isReady && meetingHref ? (
              <Button asChild size="lg" className="w-full whitespace-nowrap">
                <Link href={meetingHref}>
                  Start AI meeting <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full whitespace-nowrap">
                <Link href="/dashboard/meetings">
                  Waiting for second Shadow <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <div className="mt-3 grid gap-2">
              <Button asChild variant="secondary" size="lg" className="w-full whitespace-nowrap">
                <a href={appDeepLink}>
                  Open in Shadow <Smartphone className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="ghost" size="lg" className="w-full whitespace-nowrap">
                <a href={appStoreUrl}>
                  Download Shadow <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          {participants.length > 0 ? (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Connected Shadows: {participants.join(" and ")}.
            </p>
          ) : null}
        </div>

        <div className="w-full max-w-[520px] justify-self-center border border-border bg-card p-6 lg:justify-self-end">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div>
              <p className="font-display text-sm">Meeting invite</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {code}
              </p>
            </div>
            <Badge tone={isReady ? "blue" : hasShadow ? "dark" : "neutral"}>
              {isReady ? "Ready" : hasShadow ? "Accepted" : "Pending"}
            </Badge>
          </div>
          <div className="mt-6 grid gap-3">
            <div className="border border-border p-4">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-claret" />
                <p className="text-sm font-medium">Consent only</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                An introduction starts only after both people create or confirm
                their representative.
              </p>
            </div>
            <div className="border border-border p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-claret" />
                <p className="text-sm font-medium">Live transcript</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The conversation is structured, visible, and designed to create
                useful questions rather than shallow judgement.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
