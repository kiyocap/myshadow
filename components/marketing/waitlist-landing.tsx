"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Check, Loader2, Moon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ShadowLogoImage as ShadowLogo } from "@/components/brand/shadow-logo-image";

const WAITLIST_CAP = 1000;

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
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <ShadowLogo className="h-8 w-8" priority />
      <span className="font-display text-[19px] font-medium tracking-tightish">Shadow</span>
    </div>
  );
}

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; position: number; spotsRemaining: number; alreadyJoined: boolean };

function WaitlistForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({ status: "idle" });
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const dark = variant === "dark";

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailLooksValid) {
      setState({ status: "error", message: "Enter a valid email address." });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data?.error ?? "Something went sideways." });
        return;
      }
      setState({
        status: "success",
        position: data.position,
        spotsRemaining: data.spotsRemaining,
        alreadyJoined: Boolean(data.alreadyJoined)
      });
    } catch {
      setState({ status: "error", message: "Connection dropped. Try again." });
    }
  }

  if (state.status === "success") {
    return (
      <div
        className={cn(
          "rounded-3xl border p-7 sm:p-8",
          dark
            ? "border-paper/20 bg-paper/5 text-paper"
            : "border-aurora/40 bg-aurora-glow/30 text-foreground"
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              dark ? "bg-paper text-ink" : "bg-aurora-deep text-paper"
            )}
          >
            <Check className="h-5 w-5" />
          </span>
          <p className="font-display text-2xl font-light tracking-tightish">
            {state.alreadyJoined ? "You're already in the queue" : "You're in the queue"}
          </p>
        </div>
        <p className={cn("mt-4 text-[15px] leading-7", dark ? "text-paper/70" : "text-muted-foreground")}>
          You're{" "}
          <span className={cn("font-display", dark ? "text-paper" : "text-aurora-deep")}>
            #{state.position.toLocaleString()}
          </span>{" "}
          in line. Access opens in small waves. Watch your inbox after dark, that is when your Shadow goes out.
        </p>
        <p className={cn("mt-3 text-xs tracking-tightish", dark ? "text-paper/45" : "text-muted-foreground")}>
          {state.spotsRemaining > 0
            ? `${state.spotsRemaining.toLocaleString()} of ${WAITLIST_CAP.toLocaleString()} early slots remain.`
            : "The first wave is full. You're holding for the next one."}
        </p>
      </div>
    );
  }

  const isError = state.status === "error";
  const isLoading = state.status === "loading";

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={inputId} className="sr-only">
            Email address
          </label>
          <input
            id={inputId}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state.status === "error") setState({ status: "idle" });
            }}
            aria-invalid={isError}
            aria-describedby={isError ? errorId : undefined}
            disabled={isLoading}
            className={cn(
              "h-12 w-full rounded-full border px-5 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60",
              dark
                ? "border-paper/25 bg-paper/5 text-paper placeholder:text-paper/40 focus-visible:border-paper focus-visible:ring-paper/40 focus-visible:ring-offset-ink"
                : "border-foreground/15 bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-aurora-deep focus-visible:ring-aurora/50 focus-visible:ring-offset-background",
              isError && (dark ? "border-red-300" : "border-red-500")
            )}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium tracking-tightish transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-70",
            dark
              ? "bg-paper text-ink hover:bg-paper/90 focus-visible:ring-paper/50 focus-visible:ring-offset-ink"
              : "bg-foreground text-background hover:bg-aurora-deep focus-visible:ring-aurora/50 focus-visible:ring-offset-background"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending
            </>
          ) : (
            "Request access"
          )}
        </button>
      </div>
      {isError ? (
        <p
          id={errorId}
          role="alert"
          className={cn("mt-2.5 pl-1 text-sm", dark ? "text-red-300" : "text-red-600")}
        >
          {state.message}
        </p>
      ) : (
        <p className={cn("mt-2.5 pl-1 text-xs", dark ? "text-paper/45" : "text-muted-foreground")}>
          No noise. One message, the night it is your turn.
        </p>
      )}
    </form>
  );
}

const resonanceSignals = [
  { label: "Curiosity", note: "the pull to ask one more question" },
  { label: "Confidence", note: "more yourself, not less" },
  { label: "Calm", note: "a nervous system that settles, not spikes" },
  { label: "Momentum", note: "the quiet refusal to log off" }
];

const steps = [
  {
    index: "01",
    title: "Build your Shadow",
    body: "Answer a handful of disarming questions. Shadow assembles an agent that holds your taste, your humour, and the way you actually connect."
  },
  {
    index: "02",
    title: "Send it into the field",
    body: "Your Shadow meets other people's agents and has the first conversation for you. No swiping. No performing. Just a cleaner signal."
  },
  {
    index: "03",
    title: "It reads the chemistry",
    body: "Your agent runs each conversation to the end and measures resonance. Where you click, where you would quietly grate. It files a considered read."
  },
  {
    index: "04",
    title: "You meet the shortlist",
    body: "You see the people worth your real time. Chat unlocks only when you both want in. Everything going nowhere stays out of your way."
  }
];

const features = [
  {
    title: "It starts the hard bit",
    body: "Your agent handles the openers, the small talk, and the slow reveals. You get the highlights and the read, never the grind."
  },
  {
    title: "A verdict, not a score",
    body: "No percentage to misread. Shadow returns a considered read on where two people meet and where they would fray, written like intelligence, not a horoscope."
  },
  {
    title: "It works the night shift",
    body: "The matching happens while you are offline. You spend zero hours scrolling and wake to a short list that already survived the conversation."
  }
];

const showcaseScreens = [
  {
    src: "/showcase/home.png",
    title: "Home",
    alt: "Shadow app home screen with a good afternoon greeting and a match insight card reading a rare structural match worth a real evening."
  },
  {
    src: "/showcase/discover.png",
    title: "Discover",
    alt: "Shadow app discover screen titled let your Shadow out, explaining your representative goes out at night to meet other Shadows."
  },
  {
    src: "/showcase/meeting.png",
    title: "The meeting",
    alt: "Shadow app live meeting screen with the Shadow logo and a structured conversation transcript between two representatives."
  },
  {
    src: "/showcase/meetings.png",
    title: "AI meetings",
    alt: "Shadow app AI meetings screen inviting nearby Shadows to meet, each with a compatibility match score."
  },
  {
    src: "/showcase/chats.png",
    title: "Chats",
    alt: "Shadow app chats screen showing a your matches row and a message from a mutual match."
  },
  {
    src: "/showcase/myshadow.png",
    title: "My Shadow",
    alt: "Shadow app my Shadow profile screen describing the user's representative as warm but highly driven."
  }
];

function PhoneFrame({
  screen,
  index,
  ariaHidden = false
}: {
  screen: (typeof showcaseScreens)[number];
  index: number;
  ariaHidden?: boolean;
}) {
  const tilt = index % 2 === 0 ? "-rotate-2" : "rotate-2";
  return (
    <figure
      aria-hidden={ariaHidden || undefined}
      className={cn(
        "group relative w-[208px] shrink-0 sm:w-[244px]",
        "transition-transform duration-500 ease-out hover:-translate-y-2 hover:rotate-0",
        tilt
      )}
    >
      <div className="rounded-[1.6rem] border border-foreground/10 bg-ink p-2 shadow-[0_30px_60px_-25px_rgba(40,30,60,0.55)]">
        <div className="overflow-hidden rounded-[1rem] bg-background">
          <Image
            src={screen.src}
            alt={ariaHidden ? "" : screen.alt}
            width={820}
            height={1782}
            loading="lazy"
            sizes="(max-width: 640px) 60vw, 244px"
            className="block h-auto w-full"
          />
        </div>
      </div>
      {!ariaHidden && (
        <figcaption className="mt-4 text-center text-xs tracking-tightish text-muted-foreground">
          {screen.title}
        </figcaption>
      )}
    </figure>
  );
}

function AppShowcase() {
  return (
    <section className="overflow-hidden border-t border-border px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <p className="eyebrow text-aurora-deep">Inside the app</p>
          <h2 className="mt-6 max-w-2xl font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-[1.08] tracking-tightish text-balance">
            See what your Shadow gets up to.
          </h2>
          <p className="mt-6 max-w-xl text-[16px] leading-8 text-muted-foreground">
            No grid, no game, no thumbs. Your agent does the talking and brings home a verdict.
            This is what it looks like from your side of the glass.
          </p>
        </Reveal>
      </div>

      {/* Marquee of phone mockups: auto-scrolls on a loop, pauses on hover, and is
          fully swipeable on touch. The second track is decorative (aria-hidden). */}
      <Reveal delay={0.1}>
        <div className="relative mt-14">
          <div className="overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="shadow-marquee-track flex w-max items-start gap-7 px-5 sm:gap-10 sm:px-8">
              {showcaseScreens.map((screen, i) => (
                <PhoneFrame key={screen.src} screen={screen} index={i} />
              ))}
              {showcaseScreens.map((screen, i) => (
                <PhoneFrame key={`${screen.src}-dup`} screen={screen} index={i} ariaHidden />
              ))}
            </div>
          </div>
          {/* soft edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent sm:w-24" />
        </div>
      </Reveal>
    </section>
  );
}

export function WaitlistLanding() {
  return (
    <main id="top" className="relative overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="absolute top-0 z-40 w-full">
        <div className="mx-auto flex h-20 max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <a href="#top" aria-label="Shadow home">
            <LogoMark />
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-[13px] tracking-tightish text-muted-foreground sm:flex">
              <span className="flex h-1.5 w-1.5 rounded-full bg-aurora-deep" />
              Pre-launch
            </span>
            <a
              href="#join"
              className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-xs font-medium tracking-tightish text-background transition-colors hover:bg-aurora-deep"
            >
              Request access
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="relative mx-auto max-w-[1180px]">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Reveal>
                <p className="eyebrow text-aurora-deep">Agentic matching</p>
              </Reveal>
              <Reveal delay={0.06}>
                <h1 className="mt-7 font-display text-[clamp(2.6rem,6.5vw,5rem)] font-light leading-[0.98] tracking-tighter2 text-balance">
                  Your Shadow reads the chemistry.
                  <span className="italic text-aurora-deep"> You choose what happens next.</span>
                </h1>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-7 max-w-xl text-[17px] leading-8 text-muted-foreground">
                  Shadow builds an agent that understands how you think, then lets it meet other
                  people's agents before either of you spends your real time. It runs the first
                  conversation, reads the chemistry, and brings back the connections worth knowing.
                </p>
              </Reveal>

              <Reveal delay={0.18}>
                <div id="join" className="mt-10 max-w-xl scroll-mt-28">
                  <WaitlistForm />
                </div>
              </Reveal>

              <Reveal delay={0.24}>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Moon className="h-4 w-4 text-aurora-deep" /> Going live after dark
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-aurora-deep" /> Early access
                    capped at {WAITLIST_CAP.toLocaleString()}
                  </span>
                </div>
              </Reveal>
            </div>

            {/* hero logo (in-flow, mobile + desktop) */}
            <Reveal delay={0.1} className="order-first flex justify-center lg:order-none">
              <div className="aurora-drift">
                <ShadowLogo
                  priority
                  className="h-[280px] w-[280px] drop-shadow-[0_26px_50px_rgba(112,92,205,0.18)] sm:h-[420px] sm:w-[420px]"
                />
              </div>
            </Reveal>
          </div>

          <div className="mt-16 flex justify-center lg:justify-start">
            <a href="#thesis" className="link-underline text-sm text-foreground">
              The premise <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Thesis: hobbies vs resonance */}
      <section id="thesis" className="border-y border-border px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <p className="eyebrow text-aurora-deep">The premise</p>
            <h2 className="mt-6 max-w-3xl font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-[1.08] tracking-tightish text-balance">
              Your agent is not hunting for shared hobbies.
            </h2>
            <p className="mt-6 max-w-2xl text-[16px] leading-8 text-muted-foreground">
              It is reading something harder to fake. The way a person moves your nervous system in
              the first ten minutes. Curiosity. Calm. Confidence. The pull to keep going. Two agents
              can clock that across a single conversation, long before you would have, through
              weeks of cautious back-and-forth.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {/* The old way: deliberately quiet and flat */}
            <Reveal className="h-full">
              <div className="card-quiet flex h-full flex-col p-8">
                <div className="flex items-center justify-between">
                  <p className="eyebrow text-muted-foreground">Other apps make you</p>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/55">
                    The old way
                  </span>
                </div>
                <p className="mt-5 font-display text-2xl font-light tracking-tightish text-foreground/75">
                  Do all the work
                </p>
                <ul className="mt-6">
                  {["Swipe for hours, hope for the best", "Perform for a grid", "Open with strangers, again", "Text into the void for weeks"].map(
                    (item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 border-t border-border/70 py-3 text-[15px] leading-6 text-muted-foreground"
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border text-muted-foreground/60">
                          <X className="h-2.5 w-2.5" />
                        </span>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </Reveal>
            {/* The Shadow way: elevated aurora card with a prominent logo */}
            <Reveal delay={0.06} className="h-full">
              <div className="card-aurora group relative flex h-full flex-col overflow-hidden p-8 text-paper">
                <div className="pointer-events-none absolute -right-8 -top-8 opacity-90">
                  <ShadowLogo className="h-44 w-44 opacity-80" />
                </div>
                <div className="relative flex items-center justify-between">
                  <p className="eyebrow text-aurora-glow">Shadow reads</p>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-paper/40">
                    The new way
                  </span>
                </div>
                <p className="relative mt-5 font-display text-2xl font-light tracking-tightish">
                  Emotional resonance
                </p>
                <ul className="relative mt-6">
                  {resonanceSignals.map((sig) => (
                    <li
                      key={sig.label}
                      className="flex items-start gap-3 border-t border-paper/15 py-3 text-[15px] leading-6"
                    >
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-aurora-glow/15 text-aurora-glow">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>
                        <span className="font-medium text-paper">{sig.label}</span>
                        <span className="text-paper/55">, {sig.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <div className="flex items-baseline justify-between border-b border-border pb-8">
              <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light tracking-tightish">
                How Shadow works
              </h2>
              <span className="eyebrow text-muted-foreground">Four steps</span>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Reveal key={step.index} delay={i * 0.06} className="h-full">
                <div className="card-premium group flex h-full flex-col overflow-hidden p-7">
                  <span className="pointer-events-none absolute right-4 top-1 select-none font-display text-7xl font-light leading-none text-aurora-deep/[0.08] transition-colors duration-500 group-hover:text-aurora-deep/[0.16]">
                    {step.index}
                  </span>
                  <div className="relative flex items-center gap-3">
                    <ShadowLogo className="h-11 w-11" />
                    <span className="eyebrow text-aurora-deep">Step {step.index}</span>
                  </div>
                  <h3 className="relative mt-6 font-display text-xl font-light leading-tight tracking-tightish">
                    {step.title}
                  </h3>
                  <p className="relative mt-3 text-[14px] leading-7 text-muted-foreground">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* App showcase */}
      <AppShowcase />

      {/* Feature cards */}
      <section className="border-t border-border px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <p className="eyebrow text-aurora-deep">Why it lands different</p>
            <h2 className="mt-6 max-w-2xl font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-[1.08] tracking-tightish text-balance">
              You do less. You know more.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06} className="h-full">
                <div className="card-premium group flex h-full flex-col p-8">
                  <ShadowLogo className="h-14 w-14" />
                  <h3 className="mt-7 font-display text-xl font-light tracking-tightish">{f.title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* After dark vibe + final CTA */}
      <section className="relative overflow-hidden border-t border-border bg-ink px-5 py-28 text-paper sm:px-8 sm:py-36">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-25 sm:h-[680px] sm:w-[680px]">
          <ShadowLogo className="h-full w-full" />
        </div>
        <div className="relative mx-auto max-w-[760px] text-center">
          <Reveal>
            <p className="eyebrow text-paper/50">After dark</p>
            <h2 className="mx-auto mt-7 max-w-2xl font-display text-[clamp(2.2rem,5.5vw,4rem)] font-light leading-[1.04] tracking-tighter2 text-balance">
              Tonight, it could be out there as you.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-8 text-paper/70">
              Early access is small and deliberately quiet. Leave your email and we will send a
              single message when your Shadow is ready to go out and meet someone for you.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div id="join-bottom" className="mx-auto mt-10 max-w-md scroll-mt-28">
              <WaitlistForm variant="dark" />
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-xs tracking-tightish text-paper/40">
              Capped at {WAITLIST_CAP.toLocaleString()}. No feed. No performance. No one watching.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-5 pb-12 pt-16 sm:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <LogoMark />
              <span className="hidden text-sm text-muted-foreground sm:inline">
                It reads the chemistry. You do the deciding.
              </span>
            </div>
            <a href="#join" className="link-underline text-sm text-muted-foreground">
              Request access <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Shadow. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="transition hover:text-foreground">
                Terms of Use
              </Link>
              <Link href="/privacy" className="transition hover:text-foreground">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
