"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  FileText,
  LockKeyhole,
  MessageCircle,
  Share2,
  Sparkles,
  Users
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compatibilityReport, transcript } from "@/lib/preview-data";

const sections = [
  {
    kicker: "01",
    title: "Modern dating is inefficient.",
    body: "You spend weeks discovering basic compatibility. Let AI do the heavy lifting."
  },
  {
    kicker: "02",
    title: "Your AI knows you.",
    body: "We build a deep understanding of your personality, values, goals, communication style and what you are looking for."
  },
  {
    kicker: "03",
    title: "AI representatives meet.",
    body: "Your AI talks with their AI about the things that actually matter."
  },
  {
    kicker: "04",
    title: "Get clarity before you meet.",
    body: "We generate a detailed compatibility report so you know what to explore and what to watch out for."
  },
  {
    kicker: "05",
    title: "Invite someone.",
    body: "Send a private invite, let both representatives talk, and decide what deserves your real attention."
  }
];

const trustItems = [
  "Private by default",
  "Import controls",
  "Transparent transcript",
  "Exportable reports"
];

function LogoMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          dark
            ? "relative flex h-6 w-6 items-center justify-center rounded-full border border-black/25"
            : "relative flex h-6 w-6 items-center justify-center rounded-full border border-white/30"
        }
      >
        <span
          className={
            dark
              ? "h-2.5 w-2.5 rounded-full border border-black"
              : "h-2.5 w-2.5 rounded-full border border-white"
          }
        />
        <span
          className={
            dark
              ? "absolute -right-0.5 bottom-1 h-1.5 w-1.5 rounded-full bg-black"
              : "absolute -right-0.5 bottom-1 h-1.5 w-1.5 rounded-full bg-white"
          }
        />
      </span>
      <span className="text-sm font-semibold">Shadow</span>
    </div>
  );
}

function HeroConstellation() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute left-[7%] top-[33%] h-64 w-64 rounded-full border border-white/10" />
      <div className="absolute left-[10%] top-[29%] h-80 w-[520px] -rotate-12 rounded-[50%] border border-white/10" />
      <div className="absolute right-[8%] top-[18%] h-80 w-[520px] rotate-12 rounded-[50%] border border-white/10" />
      <div className="absolute bottom-[17%] right-[9%] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.8)]" />
      <div className="absolute bottom-[22%] left-[16%] h-1.5 w-1.5 rounded-full bg-blue-600 shadow-[0_0_18px_rgba(37,99,235,0.9)]" />
      <div className="absolute right-[16%] top-[31%] h-1.5 w-1.5 rounded-full bg-blue-300 shadow-[0_0_16px_rgba(147,197,253,0.9)]" />
      <motion.div
        className="absolute right-[11%] top-[45%] h-1 w-1 rounded-full bg-white"
        animate={{ opacity: [0.15, 1, 0.15] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[13%] top-[56%] h-1 w-1 rounded-full bg-white"
        animate={{ opacity: [1, 0.15, 1] }}
        transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function HeroVideoBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black" aria-hidden="true">
      <video
        autoPlay
        className="h-full w-full object-cover opacity-55 motion-reduce:hidden"
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src="/videos/shadow-hero.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60" />
    </div>
  );
}

function ProxyOrb({
  label,
  tone = "blue",
  compact = false
}: {
  label: string;
  tone?: "blue" | "violet";
  compact?: boolean;
}) {
  const accent = tone === "blue" ? "#2563eb" : "#8b5cf6";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={
          compact
            ? "relative h-20 w-20 rounded-full border border-white/15 bg-black"
            : "relative h-28 w-28 rounded-full border border-white/15 bg-black"
        }
        style={{ boxShadow: `0 0 34px ${accent}45` }}
      >
        <span
          className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: accent, boxShadow: `0 0 22px ${accent}` }}
        />
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className="absolute rounded-full border"
            style={{
              inset: `${10 + index * 6}px`,
              borderColor: `${accent}${index % 2 ? "33" : "22"}`
            }}
          />
        ))}
        {Array.from({ length: 16 }).map((_, index) => (
          <span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-white"
            style={{
              left: `${48 + Math.cos(index * 0.9) * (20 + (index % 4) * 6)}%`,
              top: `${48 + Math.sin(index * 0.9) * (20 + (index % 3) * 7)}%`,
              opacity: index % 3 === 0 ? 0.9 : 0.45
            }}
          />
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-white/55">Digital Representative</p>
      </div>
    </div>
  );
}

function ProfilePreview() {
  return (
    <div className="border border-border bg-white p-6 shadow-quiet-xl">
      <p className="text-sm font-semibold">Your Shadow Profile</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_1.1fr]">
        <div className="relative h-48 rounded-full border border-blue-100">
          {Array.from({ length: 7 }).map((_, ring) => (
            <span
              key={ring}
              className="absolute rounded-full border border-blue-200"
              style={{ inset: `${ring * 12 + 8}px` }}
            />
          ))}
          {Array.from({ length: 28 }).map((_, point) => (
            <span
              key={point}
              className="absolute h-1.5 w-1.5 rounded-full bg-blue-600"
              style={{
                left: `${47 + Math.cos(point * 1.1) * (point % 7) * 3.7}%`,
                top: `${48 + Math.sin(point * 0.95) * (point % 8) * 3.5}%`,
                opacity: point % 4 === 0 ? 1 : 0.45
              }}
            />
          ))}
        </div>
        <div className="space-y-4">
          {[
            ["Ambitious", 82],
            ["Analytical", 88],
            ["Introverted", 72],
            ["Creative", 62],
            ["High Integrity", 81]
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="grid grid-cols-[96px_1fr] items-center gap-3 text-sm"
            >
              <span>{label as string}</span>
              <span className="h-1.5 bg-muted">
                <span
                  className="block h-full bg-blue-600"
                  style={{ width: `${value}%` }}
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
  return (
    <div className="relative mx-auto max-w-3xl border border-border bg-black p-8 text-white shadow-quiet-xl">
      <div className="relative flex min-h-56 items-center justify-center">
        <div className="absolute h-px w-52 bg-white/15" />
        <motion.div
          className="absolute h-px w-52 bg-blue-600"
          animate={{ scaleX: [0.18, 1, 0.18], opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <ProxyOrb label="Hewie AI" compact />
        <div className="w-16" />
        <ProxyOrb label="Emily AI" tone="violet" compact />
        <span className="absolute left-1/2 top-8 max-w-[240px] -translate-x-1/2 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-center text-xs text-white/80">
          Hewie tends to become obsessive when excited about a project.
        </span>
        <span className="absolute bottom-8 left-1/2 max-w-[240px] -translate-x-1/2 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-center text-xs text-white/80">
          Emily values consistency and predictability in a partner.
        </span>
      </div>
    </div>
  );
}

function ReportPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
      <div className="border border-border bg-white p-5 shadow-quiet-xl">
        <p className="text-sm text-muted-foreground">Compatibility</p>
        <p className="mt-2 text-3xl font-semibold">86%</p>
        {[
          "Communication",
          "Lifestyle",
          "Values",
          "Ambition",
          "Humour",
          "Conflict Resolution"
        ].map((label, valueIndex) => (
          <div
            key={label}
            className="mt-3 grid grid-cols-[120px_1fr] items-center gap-3 text-xs"
          >
            <span>{label}</span>
            <span className="h-1.5 bg-muted">
              <span
                className="block h-full bg-blue-600"
                style={{ width: `${88 - valueIndex * 6}%` }}
              />
            </span>
          </div>
        ))}
      </div>
      <div className="grid gap-4">
        <div className="border border-border bg-white p-5 shadow-quiet-xl">
          <p className="text-sm text-muted-foreground">Top Strength</p>
          <p className="mt-2 text-lg font-semibold">Strong long-term potential</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Both value growth, loyalty and meaningful connection.
          </p>
        </div>
        <div className="border border-border bg-white p-5 shadow-quiet-xl">
          <p className="text-sm text-muted-foreground">Watch Out For</p>
          <p className="mt-2 text-lg font-semibold">
            Different communication styles under stress.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProxyLanding() {
  return (
    <main className="bg-background text-foreground">
      <header className="absolute top-0 z-40 w-full text-white">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Shadow home">
            <LogoMark />
          </Link>
          <nav className="hidden items-center gap-10 text-xs text-white/70 md:flex">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#trust">Security</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <Button asChild size="sm" className="bg-white text-black hover:bg-white/90">
            <Link href="/create-shadow">Create Your Shadow</Link>
          </Button>
        </div>
      </header>

      <section className="relative isolate min-h-[690px] overflow-hidden bg-black px-5 py-28 text-white sm:px-8 lg:py-32">
        <HeroVideoBackground />
        <HeroConstellation />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center text-center">
          <Badge className="w-fit border-white/10 bg-white/10 text-white/80">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
            Your digital representative.
          </Badge>
          <h1
            className="mt-10 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-white text-balance sm:text-7xl"
          >
            Before your first date,
            {" "}
            <span className="block text-[#2f6bff]">let your AIs talk.</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/75 sm:text-base"
          >
            Shadow creates digital representatives that learn about each person
            and meet before you do.
          </p>
          <div
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
              <Link href="/create-shadow">Create Your Shadow</Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="border-white/20 bg-black text-white hover:bg-white/10"
            >
              <Link href="/meeting/live">
                Watch AI Meeting <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-12 flex flex-col items-center gap-3">
            <p className="text-xs text-white/45">Trusted by early members</p>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["H", "E", "S", "O", "M"].map((avatar) => (
                  <span
                    key={avatar}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-black bg-white text-xs font-semibold text-black"
                  >
                    {avatar}
                  </span>
                ))}
              </div>
              <span className="text-xs text-white/55">+1,628</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-border px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative">
            <div className="absolute bottom-0 left-1 top-0 hidden w-px bg-border md:block" />
            {sections.map((section, index) => (
              <motion.article
                key={section.title}
                className="grid gap-8 border-b border-border py-12 last:border-b-0 md:grid-cols-[230px_1fr] md:pl-10"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
              >
                <div className="relative">
                  <span className="absolute -left-[45px] top-8 hidden h-3 w-3 rounded-full border border-blue-500 bg-white md:block" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    {section.kicker}
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold leading-tight">
                    {section.title}
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {section.body}
                  </p>
                </div>

                {index === 0 && (
                  <div className="relative min-h-72 overflow-hidden">
                    <Image
                      src="/images/shadow-facing-people.png"
                      alt="Two people facing each other before meeting"
                      fill
                      className="object-cover object-center"
                      sizes="(min-width: 768px) 760px, 100vw"
                      priority
                    />
                    <span className="absolute right-10 top-8 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <span className="absolute right-2 top-20 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground">
                      <Sparkles className="h-4 w-4" />
                    </span>
                  </div>
                )}

                {index === 1 && (
                  <div id="features" className="grid gap-6 lg:grid-cols-[1fr_1.45fr]">
                    <div className="flex flex-wrap content-start gap-2">
                      {[
                        "Values",
                        "Goals",
                        "Personality",
                        "Communication",
                        "Interests",
                        "Preferences"
                      ].map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                    </div>
                    <ProfilePreview />
                  </div>
                )}

                {index === 2 && <MeetingPreview />}
                {index === 3 && <ReportPreview />}

                {index === 4 && (
                  <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
                    <div className="border border-border bg-white p-6 shadow-quiet-xl">
                      <p className="text-sm text-muted-foreground">Your invite link</p>
                      <p className="mt-4 font-mono text-lg">shadow.to/hewie</p>
                      <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                        Send a private invite, let both representatives talk, and decide
                        what deserves your real attention.
                      </p>
                    </div>
                    <div className="mx-auto h-64 w-36 rounded-[28px] border-4 border-black bg-white p-3 shadow-quiet-xl">
                      <div className="mx-auto h-2 w-12 rounded-full bg-black" />
                      <div className="mt-8 text-xs text-muted-foreground">
                        Your AI meeting is ready
                      </div>
                      <div className="mt-4 h-24 rounded-md bg-black" />
                    </div>
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="report" className="border-y border-border bg-black px-5 py-24 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-medium text-blue-300">What Your AIs Learned</p>
            <h2 className="mt-5 text-3xl font-semibold sm:text-5xl">
              Compatibility that feels useful, not theatrical.
            </h2>
            <p className="mt-6 max-w-xl leading-7 text-white/65">
              Every report gives you a score, category-level breakdown, green
              flags, potential friction, questions to discuss, and three
              suggested first-date options.
            </p>
          </div>
          <div className="border border-white/15 bg-white p-6 text-black">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="mt-2 text-6xl font-semibold">
                  {compatibilityReport.overallScore}%
                </p>
              </div>
              <Badge tone="blue">
                <Share2 className="mr-1 h-3 w-3" />
                Share card ready
              </Badge>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ["Communication", compatibilityReport.communication],
                ["Lifestyle", compatibilityReport.lifestyle],
                ["Values", compatibilityReport.values],
                ["Ambition", compatibilityReport.ambition]
              ].map(([label, value]) => (
                <div key={label} className="border border-border p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-semibold">{value}%</span>
                  </div>
                  <div className="mt-3 h-1.5 bg-muted">
                    <div className="h-full bg-blue-600" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-3">
              {compatibilityReport.greenFlags.slice(0, 2).map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-6">
                  <Check className="mt-1 h-4 w-4 text-blue-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className="px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <LockKeyhole className="h-7 w-7 text-blue-600" />
            <h2 className="mt-6 text-3xl font-semibold sm:text-5xl">
              Built for trust before virality.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item} className="border-t border-border pt-5">
                <p className="font-medium">{item}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Clear controls, explicit consent, and explainable outputs for
                  every part of the experience.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-border px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-sm font-medium text-blue-700">Subscription</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-5xl">
                Start free. Go deeper when curiosity becomes a habit.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-border p-6">
                <p className="text-lg font-semibold">Free</p>
                <p className="mt-2 text-sm text-muted-foreground">3 AI meetings</p>
                <div className="mt-8 flex items-center gap-3 text-sm">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  Live transcript and standard report
                </div>
              </div>
              <div className="border border-black bg-black p-6 text-white">
                <p className="text-lg font-semibold">Premium</p>
                <p className="mt-2 text-sm text-white/65">
                  Unlimited meetings, deep analysis, PDF exports
                </p>
                <div className="mt-8 flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-blue-300" />
                  Built for people who need to know
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-border pt-8 md:flex-row md:items-center">
            <div>
              <p className="text-2xl font-semibold">
                This is slightly insane. That is the point.
              </p>
              <p className="mt-2 text-muted-foreground">
                Find out what your AI thinks of you, and what their AI thinks of them.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/create-shadow">
                Create Your Shadow <Users className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
