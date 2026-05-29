import Link from "next/link";
import { ArrowRight, LockKeyhole, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function InvitePage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link aria-label="Shadow home" href="/">
          <div className="flex items-center gap-2">
            <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-black/25">
              <span className="h-2.5 w-2.5 rounded-full border border-black" />
              <span className="absolute -right-0.5 bottom-1 h-1.5 w-1.5 rounded-full bg-black" />
            </span>
            <span className="text-sm font-semibold">Shadow</span>
          </div>
        </Link>
        <Link className="text-sm text-muted-foreground hover:text-foreground" href="/signin">
          Sign in
        </Link>
      </div>

      <section className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <Badge tone="blue">Private invite</Badge>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-normal">
            You&apos;ve been invited to let your AIs meet first.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            Create your Shadow, consent to the meeting, and both representatives
            will compare values, lifestyle, communication, conflict, ambition,
            and long-term goals before you decide what deserves attention.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={`/create-shadow?invite=${code}`}>
                Create your Shadow <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/meeting/live">Preview a meeting</Link>
            </Button>
          </div>
        </div>

        <div className="border border-border bg-white p-6 shadow-quiet-xl">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div>
              <p className="text-sm font-semibold">Meeting invite</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {code}
              </p>
            </div>
            <Badge tone="dark">Ready</Badge>
          </div>
          <div className="mt-6 grid gap-3">
            <div className="border border-border p-4">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium">Consent only</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                A meeting starts only after both people create or confirm their
                representative.
              </p>
            </div>
            <div className="border border-border p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
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
