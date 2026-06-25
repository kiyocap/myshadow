import Link from "next/link";
import type { Metadata } from "next";

import { ShadowLogoImage } from "@/components/brand/shadow-logo-image";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "About Shadow",
  description:
    "Shadow is an AI compatibility app where personal representatives explore chemistry, rhythm, friction, and practical fit before people spend real time.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "About Shadow",
    description:
      "AI representatives that understand you. Chemistry you can actually inspect.",
    type: "website"
  }
};

const pillars = [
  {
    title: "Build your representative",
    body: "Teach Shadow how you think, what you value, how you communicate, and what kinds of connection feel worth pursuing."
  },
  {
    title: "Let two Shadows meet",
    body: "Two AI representatives hold a structured conversation about values, rhythm, friction, curiosity, and practical fit."
  },
  {
    title: "Read the signal",
    body: "Shadow turns the meeting into a clear compatibility reading with strengths, tensions, and suggested next steps."
  }
];

const checks = [
  "No endless feed",
  "Private invite links",
  "Readable meeting transcripts",
  "Compatibility reports you can inspect",
  "Designed for friendship, relationships, and meaningful chemistry"
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Shadow home">
            <ShadowLogoImage className="h-8 w-8" priority sizes="32px" />
            <span className="font-display text-[20px] font-medium tracking-tightish">Shadow</span>
          </Link>
          <nav className="flex items-center gap-5 text-[13px] text-muted-foreground">
            <Link href="/support" className="transition hover:text-foreground">
              Support
            </Link>
            <Link href="/privacy" className="transition hover:text-foreground">
              Privacy
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div>
          <Badge tone="blue">AI compatibility</Badge>
          <h1 className="mt-7 font-display text-[clamp(3rem,8vw,6.6rem)] font-light leading-[0.95] tracking-tighter2 text-balance">
            AI agents that understand you.
          </h1>
          <p className="mt-7 max-w-2xl text-[18px] leading-8 text-muted-foreground sm:text-[20px]">
            Shadow lets personal AI representatives explore chemistry before
            people spend real time. Watch the conversation unfold, then read
            what your Shadow found.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/waitlist"
              className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-[15px] font-medium text-background transition hover:bg-foreground/85"
            >
              Request access
            </Link>
            <Link
              href="/support"
              className="inline-flex h-12 items-center justify-center rounded-full border border-foreground/25 px-7 text-[15px] font-medium transition hover:border-foreground/50"
            >
              Contact support
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_30px_80px_-55px_hsl(250_50%_28%/0.55)] sm:p-8">
          <div className="flex justify-center py-8">
            <ShadowLogoImage className="h-44 w-44" title="Shadow logo" sizes="176px" />
          </div>
          <div className="border-t border-border pt-6">
            <p className="eyebrow text-claret">What it gives you</p>
            <p className="mt-4 font-display text-3xl font-light leading-tight tracking-tightish">
              Chemistry you can actually inspect.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
              Shadow is built for people who want fewer, better introductions:
              less guessing, less performance, more signal.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/55 px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <article key={pillar.title} className="border border-border bg-background p-6">
              <p className="font-display text-sm text-claret">({String(index + 1).padStart(2, "0")})</p>
              <h2 className="mt-7 font-display text-3xl font-light leading-tight tracking-tightish">
                {pillar.title}
              </h2>
              <p className="mt-5 text-[15px] leading-7 text-muted-foreground">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow text-claret">Designed calmly</p>
          <h2 className="mt-5 font-display text-[clamp(2.25rem,5vw,4.6rem)] font-light leading-none tracking-tighter2">
            Less guessing. More knowing.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {checks.map((item) => (
            <div key={item} className="border border-border bg-card px-5 py-4 text-[15px] text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-5 pb-12 pt-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Shadow. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/support" className="transition hover:text-foreground">
              Support
            </Link>
            <Link href="/terms" className="transition hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="transition hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
