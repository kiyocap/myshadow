"use client";

import { useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform
} from "framer-motion";
import {
  ArrowRight,
  Check,
  FileText,
  LockKeyhole,
  MessageCircle,
  Share2,
  Users
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
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

function LogoMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="pixel-type flex items-center gap-2">
      <span
        className={
          dark
            ? "flex h-8 w-8 items-center justify-center border border-black bg-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)]"
            : "flex h-8 w-8 items-center justify-center border border-white/30 bg-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)]"
        }
      >
        <img
          alt=""
          className="h-7 w-7 object-contain"
          src="/images/shadow-logo-mark.png"
        />
      </span>
      <span className="text-sm font-semibold uppercase tracking-[0.08em]">Shadow</span>
    </div>
  );
}

function HeroVisualBackground({
  x,
  y
}: {
  x: ReturnType<typeof useSpring>;
  y: ReturnType<typeof useSpring>;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#101010]" aria-hidden="true">
      <motion.div
        className="absolute inset-x-[15%] top-[16%] h-[52%] border border-white/[0.06] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.07),transparent_55%)] motion-reduce:transform-none"
        style={{ x, y }}
      />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="absolute inset-x-0 bottom-0 h-24 pixel-floor" />
      <div className="absolute bottom-24 left-0 right-0 h-px bg-white/20" />
    </div>
  );
}

function HeroInsightPanel() {
  return (
    <motion.div
      className="pixel-panel pixel-type mt-8 w-full max-w-[560px] border border-white/25 bg-[#141414] p-4 text-left text-white"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            Live AI meeting
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            Compatibility signal detected
          </p>
        </div>
        <span className="border border-white/25 bg-white px-3 py-1 text-xs text-black">
          84% aligned
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-white/70 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <p className="border border-white/15 bg-white/[0.04] p-3">
          Values directness and creative momentum.
        </p>
        <span className="hidden h-px w-7 bg-white/35 sm:block" />
        <p className="border border-white/15 bg-white/[0.04] p-3">
          Responds to consistency, warmth, and follow-through.
        </p>
      </div>
    </motion.div>
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
  const accent = tone === "blue" ? "#2f6bff" : "#f4b648";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={
          compact
            ? "relative h-20 w-20 border border-white/25 bg-[#141414]"
            : "relative h-28 w-28 border border-white/25 bg-[#141414]"
        }
        style={{ boxShadow: `inset 0 -3px 0 rgba(0,0,0,0.5), 0 0 34px ${accent}30` }}
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
            className="absolute h-1 w-1 bg-white"
            style={{
              left: `${48 + Math.cos(index * 0.9) * (20 + (index % 4) * 6)}%`,
              top: `${48 + Math.sin(index * 0.9) * (20 + (index % 3) * 7)}%`,
              opacity: index % 3 === 0 ? 0.55 : 0.22
            }}
          />
        ))}
      </div>
      <div className="text-center">
        <p className="pixel-type text-sm font-semibold uppercase text-white">{label}</p>
        <p className="pixel-type text-xs text-white/45">Digital Representative</p>
      </div>
    </div>
  );
}

function DatingInefficiencyIllustration() {
  return (
    <motion.div
      className="pixel-panel relative min-h-72 overflow-hidden border border-white/25 bg-[#141414] text-white"
      whileHover={{ y: -4 }}
    >
      <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute inset-x-10 top-1/2 h-px bg-white/25" />
      <motion.div
        className="absolute left-[18%] top-1/2 h-px w-[64%] origin-left bg-white/70"
        animate={{ scaleX: [0.08, 0.58, 0.08], opacity: [0.25, 0.9, 0.25] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex min-h-72 items-center justify-between px-8 sm:px-16">
        {[
          { caption: "You", type: "person" },
          { caption: "Shadow", type: "signal" },
          { caption: "Them", type: "person" }
        ].map((item, index) => (
          <motion.div
            key={item.caption}
            className="flex flex-col items-center gap-4"
            animate={index === 1 ? { y: [0, -5, 0] } : undefined}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className={
                index === 1
                  ? "relative flex h-20 w-20 items-center justify-center border border-white/25 bg-white"
                  : "relative flex h-24 w-24 items-center justify-center border border-white/25 bg-white"
              }
            >
              <span
                className={
                  index === 1
                    ? "absolute inset-3 border border-black/20"
                    : "absolute inset-3 border border-black/20"
                }
              />
              {item.type === "signal" ? (
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#111318]">
                  <span className="h-3.5 w-3.5 rounded-full border border-white" />
                  <span className="absolute bottom-3 right-3 h-1.5 w-1.5 rounded-full bg-[#2f6bff]" />
                </span>
              ) : (
                <span className="relative flex h-11 w-11 flex-col items-center justify-end rounded-full bg-black pb-2">
                  <span className="mb-1 h-3 w-3 rounded-full bg-white" />
                  <span className="h-3 w-6 rounded-t-full bg-white" />
                </span>
              )}
            </div>
            <div className="text-center">
              <p className="pixel-type text-xs font-medium text-white/55">{item.caption}</p>
              <div className="mt-2 flex justify-center gap-1">
                {Array.from({ length: index === 1 ? 3 : 2 }).map((_, dot) => (
                  <span
                    key={dot}
                    className={index === 1 ? "h-1 w-3 bg-white" : "h-1 w-3 bg-white/25"}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ProfilePreview() {
  return (
    <div className="pixel-panel pixel-type border border-white/25 bg-[#141414] p-6 text-white">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase">Your Shadow Profile</p>
        <span className="border border-white/25 bg-white px-3 py-1 text-xs text-black">
          learning
        </span>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_1.1fr]">
        <div className="relative h-48 overflow-hidden border border-white/20 bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(47,107,255,0.18),transparent_44%)]" />
          {Array.from({ length: 7 }).map((_, ring) => (
            <span
              key={ring}
              className="absolute border border-white/15"
              style={{ inset: `${ring * 12 + 8}px` }}
            />
          ))}
          {Array.from({ length: 28 }).map((_, point) => (
            <span
              key={point}
              className={point % 5 === 0 ? "absolute h-2 w-2 rounded-full bg-[#f4b648]" : "absolute h-1.5 w-1.5 rounded-full bg-[#2f6bff]"}
              style={{
                left: `${47 + Math.cos(point * 1.1) * (point % 7) * 3.7}%`,
                top: `${48 + Math.sin(point * 0.95) * (point % 8) * 3.5}%`,
                opacity: point % 4 === 0 ? 1 : 0.45
              }}
            />
          ))}
        </div>
        <div className="space-y-4 border border-white/20 bg-black p-4">
          {[
            ["Ambitious", 82],
            ["Analytical", 88],
            ["Introverted", 72],
            ["Creative", 62],
            ["High Integrity", 81]
          ].map(([label, value]) => (
            <motion.div
              key={label as string}
              className="grid grid-cols-[96px_1fr] items-center gap-3 text-sm text-white/70"
              initial={{ opacity: 0.7 }}
              whileInView={{ opacity: 1 }}
              whileHover={{ x: 4 }}
              viewport={{ once: true }}
            >
              <span>{label as string}</span>
              <span className="h-2 bg-white/12">
                <motion.span
                  className="block h-full bg-white"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${value}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  viewport={{ once: true }}
                />
              </span>
            </motion.div>
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
    <div className="pixel-panel pixel-type relative mx-auto w-full max-w-3xl overflow-hidden border border-white/25 bg-[#141414] p-6 text-white sm:p-8">
      <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">
            Live AI meeting
          </p>
          <p className="mt-2 text-sm text-white/60">Topic 3 of 8</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {meetingMoments.map((item, index) => (
            <button
              key={item.topic}
              className={
                activeMoment === index
                  ? "h-8 border border-white bg-white px-3 text-xs font-medium text-black"
                  : "h-8 border border-white/20 px-3 text-xs text-white/55 transition hover:bg-white/10 hover:text-white"
              }
              onClick={() => setActiveMoment(index)}
              type="button"
            >
              {item.topic}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mx-auto flex min-h-40 max-w-xl items-center justify-between gap-8">
        <div className="absolute left-[88px] right-[88px] top-16 h-px bg-white/18" />
        <motion.div
          className="absolute left-[88px] right-[88px] top-16 h-px origin-left bg-white"
          animate={{ scaleX: [0.12, 1, 0.12], opacity: [0.25, 0.95, 0.25] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="relative z-10" whileHover={{ y: -6, scale: 1.03 }}>
          <ProxyOrb label="Hewie AI" compact />
        </motion.div>
        <motion.div className="relative z-10" whileHover={{ y: -6, scale: 1.03 }}>
          <ProxyOrb label="Hayley AI" tone="violet" compact />
        </motion.div>
      </div>

      <motion.div
        key={moment.topic}
        className="mt-8 grid gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="border border-white/15 bg-white/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#2f6bff]" />
            <p className="text-xs font-medium text-white/55">Hewie AI</p>
          </div>
          <p className="text-sm leading-6 text-white/78">{moment.left}</p>
        </div>
        <div className="border border-white/15 bg-white/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#f4b648]" />
            <p className="text-xs font-medium text-white/55">Hayley AI</p>
          </div>
          <p className="text-sm leading-6 text-white/78">{moment.right}</p>
        </div>
      </motion.div>
      </div>
    </div>
  );
}

function ReportPreview() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4 md:grid-cols-[0.9fr_1.1fr]">
      <motion.div
        className="pixel-panel pixel-type border border-white/25 bg-[#141414] p-5 text-white"
        whileHover={{ y: -4 }}
      >
        <p className="text-sm text-white/50">Compatibility</p>
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
            className="mt-3 grid grid-cols-[120px_1fr] items-center gap-3 text-xs text-white/65"
          >
            <span>{label}</span>
            <span className="h-2 bg-white/12">
              <motion.span
                className="block h-full bg-white"
                initial={{ width: 0 }}
                whileInView={{ width: `${88 - valueIndex * 6}%` }}
                transition={{ duration: 0.65, delay: valueIndex * 0.04 }}
                viewport={{ once: true }}
              />
            </span>
          </div>
        ))}
      </motion.div>
      <div className="grid gap-4">
        <motion.div
          className="pixel-panel pixel-type border border-white/25 bg-[#141414] p-5 text-white"
          whileHover={{ x: 4 }}
        >
          <p className="text-sm text-white/50">Top Strength</p>
          <p className="mt-2 text-lg font-semibold">Strong long-term potential</p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Both value growth, loyalty and meaningful connection.
          </p>
        </motion.div>
        <motion.div
          className="pixel-panel pixel-type border border-white/25 bg-[#141414] p-5 text-white"
          whileHover={{ x: 4 }}
        >
          <p className="text-sm text-white/50">Watch Out For</p>
          <p className="mt-2 text-lg font-semibold">
            Different communication styles under stress.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export function ProxyLanding({
  userEmail,
  userName
}: {
  userEmail?: string | null;
  userName?: string | null;
}) {
  const isSignedIn = Boolean(userEmail);
  const authLabel = userName || userEmail || "Signed in";
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const videoX = useSpring(useTransform(pointerX, [-0.5, 0.5], [-14, 14]), {
    stiffness: 70,
    damping: 22
  });
  const videoY = useSpring(useTransform(pointerY, [-0.5, 0.5], [-9, 9]), {
    stiffness: 70,
    damping: 22
  });
  const { scrollYProgress } = useScroll();
  const timelineScale = useTransform(scrollYProgress, [0.16, 0.74], [0, 1]);

  return (
    <main className="pixel-type bg-[#101010] text-white">
      <header className="absolute top-0 z-40 w-full text-black">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Shadow home">
            <div className="text-white">
              <LogoMark dark />
            </div>
          </Link>
          <nav className="pixel-panel hidden items-center gap-10 border border-black bg-white px-14 py-4 text-sm font-medium text-black md:flex">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#trust">Security</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <>
                <span className="hidden max-w-44 truncate text-xs text-white/[0.65] sm:inline">
                  Signed in as {authLabel}
                </span>
                <Button asChild size="sm" className="pixel-panel rounded-none bg-white text-black hover:bg-white/90">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <SignOutButton className="rounded-none border-black bg-white text-black hover:bg-white/80" />
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="pixel-panel rounded-none border-black bg-white text-black hover:bg-white/80"
                >
                  <Link href="/signin">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="pixel-panel rounded-none bg-white text-black hover:bg-white/90">
                  <Link href="/create-shadow">Create Your Shadow</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section
        className="relative isolate min-h-[760px] overflow-hidden bg-[#101010] px-5 py-28 text-white sm:px-8 lg:py-32"
        onMouseLeave={() => {
          pointerX.set(0);
          pointerY.set(0);
        }}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
          pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
        }}
      >
        <HeroVisualBackground x={videoX} y={videoY} />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center text-center">
          <Badge className="w-fit rounded-none border-white/25 bg-black text-white">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
            Insert representative.
          </Badge>
          <h1
            className="mt-10 max-w-4xl text-4xl font-semibold uppercase leading-[1.12] tracking-[0.02em] text-white text-balance sm:text-6xl lg:text-7xl"
          >
            Before your first date,
            <span className="block">send your AIs into the arena.</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/55 sm:text-base"
          >
            Create a private digital representative that learns your values,
            style and goals, then meets theirs before you spend your time.
          </p>
          <div
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="pixel-panel rounded-none bg-white text-black hover:bg-white/90">
              <Link href={isSignedIn ? "/dashboard" : "/create-shadow"}>
                {isSignedIn ? "Go to Dashboard" : "Create Your Shadow"}
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="rounded-none border-white/25 bg-black text-white hover:bg-white/10"
            >
              <Link href="/meeting/demo">
                Watch Demo Meeting <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <HeroInsightPanel />
          <div className="mt-12 flex flex-col items-center gap-3">
            <p className="text-xs text-white/35">Press tab to continue</p>
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
              <span className="text-xs text-white/75">+1,628</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-white/10 bg-[#101010] px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            className="group/timeline relative"
          >
            <div className="absolute bottom-0 left-1 top-0 hidden w-px bg-white/20 md:block" />
            <motion.div
              className="absolute bottom-0 left-1 top-0 hidden w-px origin-top bg-white md:block"
              style={{ scaleY: timelineScale }}
              aria-hidden="true"
            />
            {sections.map((section, index) => (
              <motion.article
                key={section.title}
                className="grid gap-8 border-b border-white/10 py-14 last:border-b-0 md:grid-cols-[230px_1fr] md:pl-10"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
              >
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
                    {section.kicker}
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold uppercase leading-tight text-white sm:text-4xl">
                    {section.title}
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-white/45">
                    {section.body}
                  </p>
                </div>

                {index === 0 && (
                  <div className="mx-auto w-full max-w-3xl">
                    <DatingInefficiencyIllustration />
                  </div>
                )}

                {index === 1 && (
                  <div id="features" className="mx-auto w-full max-w-3xl">
                    <ProfilePreview />
                  </div>
                )}

                {index === 2 && <MeetingPreview />}
                {index === 3 && <ReportPreview />}

                {index === 4 && (
                  <div className="mx-auto grid w-full max-w-3xl gap-4 md:grid-cols-[0.9fr_1.1fr]">
                    <div className="pixel-panel border border-white/25 bg-[#141414] p-6 text-white">
                      <p className="text-sm text-white/45">Your invite link</p>
                      <p className="mt-4 font-mono text-lg">shadow.to/hewie</p>
                      <p className="mt-4 max-w-md text-sm leading-6 text-white/55">
                        Send a private invite, let both representatives talk, and decide
                        what deserves your real attention.
                      </p>
                    </div>
                    <motion.div
                      className="pixel-panel border border-white/25 bg-[#141414] p-5 text-white"
                      whileHover={{ y: -5 }}
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <LogoMark />
                        <span className="text-xs text-white/45">Private invite</span>
                      </div>
                      <p className="mt-7 max-w-xs text-2xl font-semibold leading-tight">
                        Hewie invited you to let your AIs meet first.
                      </p>
                      <div className="mt-8 grid gap-3">
                        <div className="border border-white/15 bg-white/[0.04] p-4">
                          <p className="text-xs text-white/45">Meeting status</p>
                          <div className="mt-3 flex items-center justify-between gap-4">
                            <span className="text-sm font-medium">Ready when you are</span>
                            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_18px_rgba(37,99,235,0.9)]" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="border border-white/15 p-3">
                            <p className="text-xs text-white/45">Time</p>
                            <p className="mt-2 text-sm font-medium">8 min</p>
                          </div>
                          <div className="border border-white/15 p-3">
                            <p className="text-xs text-white/45">Privacy</p>
                            <p className="mt-2 text-sm font-medium">Consent only</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-7 flex items-center justify-between">
                        <span className="font-mono text-sm text-white/[0.55]">shadow.to/hewie</span>
                        <ArrowRight className="h-4 w-4 text-blue-300" />
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="report" className="border-y border-white/10 bg-[#101010] px-5 py-24 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/35">What Your AIs Learned</p>
            <h2 className="mt-5 text-4xl font-semibold uppercase text-white sm:text-6xl">
              Compatibility that feels useful, not theatrical.
            </h2>
            <p className="mt-6 max-w-xl leading-7 text-white/50">
              Every report gives you a score, category-level breakdown, green
              flags, potential friction, questions to discuss, and three
              suggested first-date options.
            </p>
          </div>
          <div className="pixel-panel border border-white/25 bg-[#141414] p-6 text-white">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm text-white/50">Overall Score</p>
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
                <div key={label} className="border border-white/15 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-semibold">{value}%</span>
                  </div>
                  <div className="mt-3 h-2 bg-white/12">
                    <div className="h-full bg-white" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-3">
              {compatibilityReport.greenFlags.slice(0, 2).map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-6">
                  <Check className="mt-1 h-4 w-4 text-white" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className="bg-[#101010] px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <LockKeyhole className="h-7 w-7 text-white/45" />
            <h2 className="mt-6 text-4xl font-semibold uppercase text-white sm:text-6xl">
              Built for trust before virality.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item} className="pixel-panel border border-white/25 bg-[#141414] p-5 text-white">
                <p className="font-medium">{item}</p>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  Clear controls, explicit consent, and explainable outputs for
                  every part of the experience.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10 bg-[#101010] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/35">Subscription</p>
              <h2 className="mt-4 text-4xl font-semibold uppercase text-white sm:text-6xl">
                Start free. Go deeper when curiosity becomes a habit.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="pixel-panel border border-white/25 bg-[#141414] p-6 text-white">
                <p className="text-lg font-semibold">Free</p>
                <p className="mt-2 text-sm text-white/50">3 AI meetings</p>
                <div className="mt-8 flex items-center gap-3 text-sm">
                  <MessageCircle className="h-4 w-4 text-white" />
                  Live transcript and standard report
                </div>
              </div>
              <div className="pixel-panel border border-white/25 bg-white p-6 text-black">
                <p className="text-lg font-semibold">Premium</p>
                <p className="mt-2 text-sm text-black/60">
                  Unlimited meetings, deep analysis, PDF exports
                </p>
                <div className="mt-8 flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-black" />
                  Built for people who need to know
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center">
            <div>
              <p className="text-2xl font-semibold">
                This is slightly insane. That is the point.
              </p>
              <p className="mt-2 text-white/50">
                Find out what your AI thinks of you, and what their AI thinks of them.
              </p>
            </div>
            <Button asChild size="lg" className="pixel-panel rounded-none bg-white text-black hover:bg-white/90">
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
