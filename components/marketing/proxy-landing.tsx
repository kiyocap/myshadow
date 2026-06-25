"use client";

import { useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform
} from "framer-motion";
import { ArrowDown, ArrowUpRight, Check } from "lucide-react";

import { PetalBloom } from "@/components/brand/petal-bloom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Salon } from "@/components/marketing/salon";
import { compatibilityReport } from "@/lib/preview-data";

const stats = [
  {
    figure: "6",
    unit: "weeks",
    headline: "spent discovering what a reading reveals in minutes.",
    note: "The average courtship spends its first six weeks confirming basic compatibility — the part Shadow resolves before you meet."
  },
  {
    figure: "8",
    unit: "minutes",
    headline: "is all a Shadow introduction takes, end to end.",
    note: "Two representatives hold a structured conversation across eight dimensions while you go about your day."
  },
  {
    figure: "89",
    unit: "%",
    headline: "of members said the reading matched the person.",
    note: "Compatibility is not a horoscope. When the inputs are honest, the reading is uncannily faithful to reality."
  },
  {
    figure: "1",
    unit: "",
    headline: "conversation decides whether you ever meet.",
    note: "No endless threads. One private introduction, one considered reading, one decision worth your attention."
  }
];

const methods = [
  {
    index: "01",
    kicker: "The Portrait",
    title: "We render a faithful likeness of who you are.",
    lede: "Building a representative from your values, ambitions, and the particular way you love and disagree.",
    body: "Most profiles flatten a person into preferences. We do the opposite — assembling a careful, attentive model of your character from your own words, then refining it until it sounds unmistakably like you.",
    approach: [
      "Guided reflection on values, attachment, and intent",
      "Optional import from your own writing and conversations",
      "Calibration until the voice is unmistakably yours"
    ],
    outcome: "A representative discreet enough to trust with the truth, and precise enough to speak for it."
  },
  {
    index: "02",
    kicker: "The Introduction",
    title: "Two representatives meet before you do.",
    lede: "A structured, observable conversation about the things that actually decide a relationship.",
    body: "Your Shadow sits down with theirs and moves, topic by topic, through the dimensions that matter — values, communication, ambition, conflict — surfacing alignment and friction long before a first message is sent.",
    approach: [
      "Eight dimensions, examined in sequence",
      "A transcript you may read in full",
      "No performance, no posturing — only signal"
    ],
    outcome: "Clarity on whether there is something here, arrived at quietly and without exposure."
  },
  {
    index: "03",
    kicker: "The Reading",
    title: "A considered account of where you meet, and where you might not.",
    lede: "Compatibility written like a letter from a trusted advisor, not a score from a machine.",
    body: "Every introduction concludes in a reading: an overall measure, a breakdown by dimension, the green flags worth pursuing, the frictions worth handling gently, and the questions worth asking on a first evening together.",
    approach: [
      "An overall measure and dimension-level detail",
      "Green flags, gentle frictions, questions to explore",
      "Three first-meeting ideas chosen for the two of you"
    ],
    outcome: "You arrive informed, curious, and unhurried — already knowing what to protect."
  },
  {
    index: "04",
    kicker: "The Invitation",
    title: "Invite someone in, on your terms.",
    lede: "A private, consent-first invitation. Nothing happens without both of you agreeing to it.",
    body: "Send a discreet link. When they accept, the introduction begins and the reading follows. You decide what to share, what to keep, and who is worthy of your real attention.",
    approach: [
      "One private link, revocable at any time",
      "Both parties consent before anything begins",
      "Your story stays yours, always"
    ],
    outcome: "Connection that starts from understanding rather than guesswork."
  }
];

const trustItems = [
  {
    title: "No feed, no performance",
    body: "Shadow isn't a place to be seen. There's nothing to scroll and no one to impress — just real introductions, one at a time."
  },
  {
    title: "You control every import",
    body: "Nothing enters your portrait without your explicit consent — and nothing stays that you ask to remove."
  },
  {
    title: "A transcript you can read",
    body: "Every introduction is observable in full. The reasoning behind a reading is never hidden from you."
  },
  {
    title: "Readings are yours to keep",
    body: "Export any reading as a keepsake. What you learn about yourself belongs to you."
  }
];

const meetingMoments = [
  {
    topic: "Values",
    left: "Hewie protects creative momentum and needs depth to feel fully present.",
    right: "Hayley reads consistency as care and trusts people who follow through quietly."
  },
  {
    topic: "Communication",
    left: "Hewie becomes direct when the stakes feel high, then softens once there is clarity.",
    right: "Hayley prefers earlier reassurance, especially before a problem becomes urgent."
  },
  {
    topic: "Ambition",
    left: "Hewie is energized by big work and can lose track of recovery time.",
    right: "Hayley admires drive when it still leaves room for rituals, rest and attention."
  }
];

function LogoMark({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  return (
    <div className="flex items-center gap-2.5">
      <PetalBloom size={24} tone={tone === "paper" ? "dark" : "light"} />
      <span className="font-display text-[19px] font-medium tracking-tightish">Shadow</span>
    </div>
  );
}

function ScrollMeter() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const [pct, setPct] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setPct(Math.round(v * 100)));

  return (
    <>
      <motion.div
        className="fixed left-0 top-0 z-50 h-px w-full origin-left bg-claret"
        style={{ scaleX }}
        aria-hidden="true"
      />
      <div className="pointer-events-none fixed bottom-6 left-6 z-50 hidden items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground md:flex">
        <span className="font-display text-foreground">{String(pct).padStart(3, "0")}</span>
        <span className="rule w-8" />
        <span>SCROLL</span>
      </div>
    </>
  );
}

function Reveal({
  children,
  delay = 0,
  className
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function ProfilePreview() {
  return (
    <div className="border border-border bg-card p-7">
      <div className="flex items-center justify-between">
        <p className="eyebrow text-muted-foreground">Portrait</p>
        <span className="font-display text-sm text-muted-foreground">fig. 01</span>
      </div>
      <div className="mt-7 grid gap-7 sm:grid-cols-[1fr_1.1fr]">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden border border-border bg-background">
          <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, ring) => (
              <circle
                key={ring}
                cx="100"
                cy="100"
                r={16 + ring * 10}
                fill="none"
                stroke="hsl(34 16% 84%)"
                strokeWidth="0.6"
              />
            ))}
            {/* slowly rotating claret signature arcs */}
            <motion.g
              style={{ transformOrigin: "100px 100px" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            >
              <circle cx="100" cy="100" r="56" fill="none" stroke="hsl(350 30% 32%)" strokeWidth="1.1" strokeDasharray="130 220" opacity="0.75" />
              <circle cx="100" cy="100" r="84" fill="none" stroke="hsl(350 30% 32%)" strokeWidth="1" strokeDasharray="70 460" opacity="0.5" />
            </motion.g>
            {/* counter-rotating trait nodes */}
            <motion.g
              style={{ transformOrigin: "100px 100px" }}
              animate={{ rotate: -360 }}
              transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            >
              {Array.from({ length: 9 }).map((_, i) => {
                const angle = (i / 9) * Math.PI * 2;
                const r = 36 + (i % 3) * 24;
                return (
                  <circle
                    key={i}
                    cx={100 + Math.cos(angle) * r}
                    cy={100 + Math.sin(angle) * r}
                    r={i % 3 === 0 ? 2.4 : 1.5}
                    fill="hsl(26 14% 9%)"
                    opacity={i % 3 === 0 ? 0.9 : 0.4}
                  />
                );
              })}
            </motion.g>
            {/* centre venn mark — the likeness */}
            <g transform="translate(100 100)">
              <circle cx="-7.5" cy="0" r="14" fill="hsl(40 33% 99%)" stroke="hsl(26 14% 9%)" strokeWidth="1.5" />
              <circle cx="7.5" cy="0" r="14" fill="none" stroke="hsl(350 30% 32%)" strokeWidth="1.5" />
            </g>
          </svg>
          <span className="absolute bottom-3 left-3 eyebrow text-muted-foreground">Likeness</span>
        </div>
        <div className="space-y-4 self-center">
          {[
            ["Loyal", 88],
            ["Introspective", 74],
            ["Ambitious", 82],
            ["Warm", 79],
            ["Independent", 66]
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="grid grid-cols-[110px_1fr] items-center gap-3 text-sm"
            >
              <span className="text-muted-foreground">{label as string}</span>
              <span className="h-px bg-border">
                <motion.span
                  className="block h-px bg-foreground"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${value}%` }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MeetingPreview() {
  const [activeMoment, setActiveMoment] = useState(0);
  const moment = meetingMoments[activeMoment];

  return (
    <div className="relative w-full bg-ink p-7 text-paper sm:p-9">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-paper/45">Introduction · live</p>
          <p className="mt-2 font-display text-sm text-paper/70">Topic 3 of 8</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {meetingMoments.map((item, index) => (
            <button
              key={item.topic}
              className={
                activeMoment === index
                  ? "h-8 rounded-full bg-paper px-4 text-xs font-medium text-ink"
                  : "h-8 rounded-full border border-paper/20 px-4 text-xs text-paper/55 transition hover:border-paper/40 hover:text-paper"
              }
              onClick={() => setActiveMoment(index)}
              type="button"
            >
              {item.topic}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mx-auto flex min-h-32 max-w-xl items-center justify-between gap-8">
        <div className="absolute left-12 right-12 top-1/2 h-px bg-paper/15" />
        <motion.div
          className="absolute left-12 right-12 top-1/2 h-px origin-left bg-claret"
          animate={{ scaleX: [0.12, 1, 0.12], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        {[
          { name: "Hewie", op: 0.92 },
          { name: "Hayley", op: 0.6 }
        ].map((p) => (
          <div key={p.name} className="relative z-10 flex flex-col items-center gap-3">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full border border-paper/25"
              style={{ background: "hsl(26 14% 9%)" }}
            >
              <svg width="30" height="20" viewBox="0 0 26 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="hsl(40 33% 94%)" strokeWidth="1" opacity={p.op} />
                <circle cx="17" cy="9" r="7" stroke="hsl(350 30% 52%)" strokeWidth="1" opacity={p.op} />
              </svg>
            </span>
            <span className="text-xs text-paper/60">{p.name} AI</span>
          </div>
        ))}
      </div>

      <motion.div
        key={moment.topic}
        className="mt-8 grid gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="border-t border-paper/15 pt-4">
          <p className="eyebrow text-paper/40">Hewie AI</p>
          <p className="mt-2 font-display text-[17px] leading-7 text-paper/90">{moment.left}</p>
        </div>
        <div className="border-t border-paper/15 pt-4">
          <p className="eyebrow text-paper/40">Hayley AI</p>
          <p className="mt-2 font-display text-[17px] leading-7 text-paper/90">{moment.right}</p>
        </div>
      </motion.div>
    </div>
  );
}

function ReportPreview() {
  return (
    <div className="border border-border bg-card p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow text-muted-foreground">The Reading</p>
          <p className="mt-3 font-display text-6xl font-light leading-none tracking-tightish">
            {compatibilityReport.overallScore}
            <span className="text-2xl align-top text-muted-foreground">%</span>
          </p>
        </div>
        <span className="font-display text-sm text-muted-foreground">fig. 03</span>
      </div>
      <div className="mt-8 space-y-3">
        {[
          ["Communication", compatibilityReport.communication],
          ["Lifestyle", compatibilityReport.lifestyle],
          ["Values", compatibilityReport.values],
          ["Ambition", compatibilityReport.ambition]
        ].map(([label, value]) => (
          <div key={label as string} className="grid grid-cols-[120px_1fr_36px] items-center gap-3 text-sm">
            <span className="text-muted-foreground">{label as string}</span>
            <span className="h-px bg-border">
              <motion.span
                className="block h-px bg-foreground"
                initial={{ width: 0 }}
                whileInView={{ width: `${value as number}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
              />
            </span>
            <span className="text-right font-display">{value as number}</span>
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-3 border-t border-border pt-6">
        {compatibilityReport.greenFlags.slice(0, 2).map((item) => (
          <div key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-claret" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvitePreview() {
  return (
    <div className="bg-ink p-8 text-paper">
      <div className="flex items-center justify-between border-b border-paper/15 pb-5">
        <LogoMark tone="paper" />
        <span className="eyebrow text-paper/40">Private invite</span>
      </div>
      <p className="mt-8 max-w-sm font-display text-2xl font-light leading-snug">
        Hewie invites you to let your minds meet first.
      </p>
      <div className="mt-9 grid grid-cols-3 gap-px overflow-hidden border border-paper/15 bg-paper/15">
        {[
          ["Duration", "8 minutes"],
          ["Privacy", "Consent only"],
          ["Status", "Ready"]
        ].map(([k, v]) => (
          <div key={k} className="bg-ink p-4">
            <p className="eyebrow text-paper/40">{k}</p>
            <p className="mt-2 text-sm">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <span className="font-mono text-sm text-paper/55">shadow.to/hewie</span>
        <ArrowUpRight className="h-4 w-4 text-claret" />
      </div>
    </div>
  );
}

const previews = [
  <ProfilePreview key="p" />,
  <MeetingPreview key="m" />,
  <ReportPreview key="r" />,
  <InvitePreview key="i" />
];

export function ProxyLanding({
  userEmail
}: {
  userEmail?: string | null;
  userName?: string | null;
}) {
  const isSignedIn = Boolean(userEmail);
  const { scrollYProgress } = useScroll();
  const heroFade = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <main className="bg-background text-foreground">
      <ScrollMeter />

      <header className="absolute top-0 z-40 w-full">
        <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Shadow home">
            <LogoMark />
          </Link>
          <nav className="hidden items-center gap-9 text-[13px] tracking-tightish text-muted-foreground md:flex">
            <a href="#salon" className="transition hover:text-foreground">Try it</a>
            <a href="#field" className="transition hover:text-foreground">The Field</a>
            <a href="#method" className="transition hover:text-foreground">The Method</a>
            <a href="#discretion" className="transition hover:text-foreground">Trust</a>
            <a href="#membership" className="transition hover:text-foreground">Membership</a>
          </nav>
          <div className="flex items-center gap-2.5">
            {isSignedIn ? (
              <>
                <Button asChild size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <SignOutButton className="border-foreground/25 text-foreground hover:border-foreground/50" />
              </>
            ) : (
              <>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/signin">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/create-shadow">Create your shadow</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
        <motion.div style={{ opacity: heroFade }} className="mx-auto max-w-[1240px]">
          <Reveal>
            <p className="eyebrow text-muted-foreground">Agentic Matchmaking · Est. 2026</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-8 max-w-5xl font-display text-[clamp(2.75rem,8vw,6.5rem)] font-light leading-[0.98] tracking-tighter2 text-balance">
              Let your minds meet
              <br className="hidden sm:block" />
              <span className="italic"> before you do.</span>
            </h1>
          </Reveal>
          <div className="mt-12 grid gap-10 border-t border-border pt-10 md:grid-cols-[1.4fr_1fr] md:items-end">
            <Reveal delay={0.12}>
              <p className="max-w-xl text-[17px] leading-8 text-muted-foreground">
                Shadow composes an attentive representative of who you truly are, then
                introduces it to another. Two minds hold the conversation that
                normally takes weeks — and you receive a considered reading before
                you ever say hello.
              </p>
            </Reveal>
            <Reveal delay={0.18} className="flex flex-col items-start gap-5 md:items-end">
              <Button asChild size="lg">
                <Link href={isSignedIn ? "/dashboard" : "/create-shadow"}>
                  {isSignedIn ? "Enter your dashboard" : "Create your shadow"}
                </Link>
              </Button>
              <a href="#method" className="link-underline text-sm text-foreground">
                Discover the method <ArrowDown className="h-4 w-4" />
              </a>
            </Reveal>
          </div>
        </motion.div>
      </section>

      {/* Principle / quote */}
      <section className="border-y border-border px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <p className="eyebrow text-claret">The Shadow principle</p>
            <blockquote className="mt-8 max-w-4xl font-display text-[clamp(1.6rem,3.6vw,3rem)] font-light leading-[1.15] tracking-tightish text-balance">
              &ldquo;Attraction is effortless. Compatibility is architecture. Shadow lets
              you see the architecture — clearly, privately — before you fall.&rdquo;
            </blockquote>
            <div className="mt-9 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="rule w-10" />
              <span>A quieter way to begin something serious</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Evidence / stats */}
      <section id="evidence" className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <h2 className="max-w-2xl font-display text-3xl font-light leading-tight tracking-tightish sm:text-4xl">
              The case for meeting minds first.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Reveal key={stat.headline} delay={index * 0.06} className="h-full">
                <div className="flex h-full flex-col bg-background p-7">
                  <p className="font-display text-6xl font-light leading-none tracking-tighter2">
                    {stat.figure}
                    {stat.unit && (
                      <span className="ml-1 text-xl text-muted-foreground">{stat.unit}</span>
                    )}
                  </p>
                  <p className="mt-5 text-sm font-medium leading-6">{stat.headline}</p>
                  <p className="mt-4 border-t border-border pt-4 text-[13px] leading-6 text-muted-foreground">
                    {stat.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Live demo */}
      <section id="salon" className="border-t border-border px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1240px]">
          <Salon />
        </div>
      </section>

      {/* The Field */}
      <section id="field" className="border-t border-border bg-ink px-5 py-24 text-paper sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="eyebrow text-paper/45">The Field</p>
              <h2 className="mt-6 font-display text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.05] tracking-tightish text-balance">
                Your shadow goes out every night.
              </h2>
              <p className="mt-6 max-w-md leading-7 text-paper/65">
                While you sleep, your representative meets other shadows in your area. Not swiping.
                Not matching on photos. Actual conversation — values, wit, conflict style, what
                someone is like on a hard day.
              </p>
              <p className="mt-4 max-w-md leading-7 text-paper/65">
                By morning, you wake up to a reading: who they got on with, how compatible you
                really are, and — if the signal is right — a suggested first date with a
                place and a reason.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  { n: "847", label: "shadows in London tonight" },
                  { n: "93%", label: "the highest match score last night" },
                  { n: "2 mi", label: "average distance of a strong match" },
                  { n: "4:20 am", label: "when most shadow meetings end" }
                ].map((s) => (
                  <div key={s.n} className="border-t border-paper/15 pt-4">
                    <p className="font-display text-2xl font-light text-paper">{s.n}</p>
                    <p className="mt-1 text-sm text-paper/50">{s.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="border border-paper/15 bg-paper/5 p-6 backdrop-blur">
                <div className="flex items-center justify-between border-b border-paper/10 pb-5">
                  <p className="eyebrow text-paper/40">This morning&apos;s reading</p>
                  <span className="flex h-2 w-2 rounded-full bg-claret">
                    <span className="h-2 w-2 animate-ping rounded-full bg-claret opacity-60" />
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { name: "Priya, 30", loc: "Hackney Wick · 2.1 mi", score: 93, time: "12:33 am", tag: "Rare match" },
                    { name: "Clara, 29", loc: "Shoreditch · 1.2 mi", score: 91, time: "2:14 am", tag: "Slow burn, high signal" },
                    { name: "Mira, 27", loc: "Bethnal Green · 0.9 mi", score: 88, time: "1:58 am", tag: "Quietly extraordinary" }
                  ].map((m) => (
                    <div key={m.name} className="flex items-center gap-4 border-b border-paper/10 pb-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-paper/20 font-display text-sm text-paper">
                        {m.score}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-display text-sm font-light text-paper">{m.name}</p>
                          <span className="text-[10px] uppercase tracking-widest text-paper/35">{m.tag}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-paper/45">{m.loc} · met at {m.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-5 text-paper/35">
                  Your shadow met {(847).toLocaleString()} others in your area last night.
                  Three are worth your morning.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The Method */}
      <section id="method" className="border-t border-border px-5 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex items-baseline justify-between border-b border-border py-8">
            <h2 className="font-display text-2xl font-light tracking-tightish">The Method</h2>
            <span className="eyebrow text-muted-foreground">Four movements</span>
          </div>

          {methods.map((m, index) => (
            <article
              key={m.index}
              className="grid gap-x-12 gap-y-10 border-b border-border py-16 lg:grid-cols-[0.95fr_1.05fr] lg:py-24"
            >
              <div>
                <Reveal>
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-sm text-claret">({m.index})</span>
                    <span className="eyebrow text-muted-foreground">{m.kicker}</span>
                  </div>
                  <h3 className="mt-6 max-w-md font-display text-[clamp(1.7rem,3vw,2.6rem)] font-light leading-[1.1] tracking-tightish text-balance">
                    {m.title}
                  </h3>
                  <p className="mt-6 max-w-md text-[15px] font-medium leading-7">{m.lede}</p>
                  <p className="mt-4 max-w-md text-[15px] leading-7 text-muted-foreground">
                    {m.body}
                  </p>
                  <div className="mt-8 max-w-md">
                    <p className="eyebrow text-muted-foreground">Approach</p>
                    <ul className="mt-4 space-y-3">
                      {m.approach.map((a) => (
                        <li key={a} className="flex gap-3 border-t border-border pt-3 text-sm leading-6">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-claret" />
                          <span className="text-muted-foreground">{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-8 max-w-md border-l-2 border-claret/40 pl-4">
                    <p className="eyebrow text-muted-foreground">Outcome</p>
                    <p className="mt-2 text-sm leading-7">{m.outcome}</p>
                  </div>
                </Reveal>
              </div>
              <Reveal delay={0.1} className="lg:pt-2">
                {previews[index]}
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      {/* Discretion */}
      <section id="discretion" className="border-t border-border bg-ink px-5 py-24 text-paper sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <Reveal>
              <p className="eyebrow text-paper/45">Trust</p>
              <h2 className="mt-6 max-w-md font-display text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.05] tracking-tightish text-balance">
                Built on consent and control.
              </h2>
              <p className="mt-6 max-w-sm leading-7 text-paper/65">
                Your representative only knows what you choose to tell it. No feed to
                scroll, no audience to perform for — just one considered introduction
                at a time.
              </p>
            </Reveal>
            <div className="grid gap-px border-t border-paper/15">
              {trustItems.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.05}>
                  <div className="grid gap-3 border-b border-paper/15 py-7 sm:grid-cols-[180px_1fr] sm:gap-8">
                    <p className="font-display text-lg font-light">{item.title}</p>
                    <p className="text-sm leading-7 text-paper/60">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <Reveal>
              <p className="eyebrow text-claret">Membership</p>
              <h2 className="mt-6 font-display text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.05] tracking-tightish text-balance">
                Start free. Stay when curiosity becomes courtship.
              </h2>
            </Reveal>
            <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
              <Reveal className="h-full">
                <div className="flex h-full flex-col bg-background p-8">
                  <p className="font-display text-xl font-light">Free</p>
                  <p className="mt-2 text-sm text-muted-foreground">Three introductions, with our compliments</p>
                  <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3 border-t border-border pt-3"><Check className="mt-0.5 h-4 w-4 text-claret" /> Full transcript of each introduction</li>
                    <li className="flex gap-3 border-t border-border pt-3"><Check className="mt-0.5 h-4 w-4 text-claret" /> A standard reading per match</li>
                  </ul>
                  <div className="mt-8 pt-4">
                    <Button asChild variant="secondary" size="sm">
                      <Link href="/create-shadow">Start free</Link>
                    </Button>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.06} className="h-full">
                <div className="flex h-full flex-col bg-ink p-8 text-paper">
                  <div className="flex items-center gap-3">
                    <p className="font-display text-xl font-light">Patron</p>
                    <Badge className="border-paper/25 text-paper/70">Premium</Badge>
                  </div>
                  <p className="mt-2 text-sm text-paper/65">Unlimited introductions and the full reading</p>
                  <ul className="mt-8 space-y-3 text-sm text-paper/65">
                    <li className="flex gap-3 border-t border-paper/15 pt-3"><Check className="mt-0.5 h-4 w-4 text-claret" /> Deep analysis across all dimensions</li>
                    <li className="flex gap-3 border-t border-paper/15 pt-3"><Check className="mt-0.5 h-4 w-4 text-claret" /> Keepsake exports of every reading</li>
                  </ul>
                  <div className="mt-8 pt-4">
                    <Button asChild size="sm" className="bg-paper text-ink hover:bg-paper/90">
                      <Link href="/create-shadow">Become a patron</Link>
                    </Button>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-5 pb-12 pt-20 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <p className="max-w-4xl font-display text-[clamp(2rem,6vw,5rem)] font-light leading-[1.02] tracking-tighter2 text-balance">
              Let your minds meet first.
            </p>
          </Reveal>
          <div className="mt-16 grid gap-10 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <LogoMark />
              <p className="mt-4 max-w-[15rem] text-sm leading-6 text-muted-foreground">
                Agentic Matchmaking for people who would rather know than wonder.
              </p>
            </div>
            <div>
              <p className="eyebrow text-muted-foreground">Navigate</p>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                <li><a href="#salon" className="transition hover:text-foreground">Live demo</a></li>
                <li><a href="#field" className="transition hover:text-foreground">The Field</a></li>
                <li><a href="#method" className="transition hover:text-foreground">The Method</a></li>
                <li><a href="#discretion" className="transition hover:text-foreground">Trust</a></li>
                <li><a href="#membership" className="transition hover:text-foreground">Membership</a></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow text-muted-foreground">Begin</p>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                <li><Link href="/create-shadow" className="transition hover:text-foreground">Create your shadow</Link></li>
                <li><Link href="/signin" className="transition hover:text-foreground">Sign in</Link></li>
                <li><Link href="/meeting/demo" className="transition hover:text-foreground">Watch two meet</Link></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow text-muted-foreground">Legal</p>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                <li><Link href="/terms" className="transition hover:text-foreground">Terms of Use</Link></li>
                <li><Link href="/privacy" className="transition hover:text-foreground">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Shadow. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="transition hover:text-foreground">Terms</Link>
              <Link href="/privacy" className="transition hover:text-foreground">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
