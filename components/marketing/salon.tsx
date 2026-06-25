"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type Topic = "Values" | "Communication" | "Ambition";

type Persona = {
  id: string;
  name: string;
  archetype: string;
  traits: {
    warmth: number;
    ambition: number;
    structure: number;
    spontaneity: number;
    depth: number;
  };
  flag: string;
  friction: string;
  lines: Record<Topic, string[]>;
};

const topics: Topic[] = ["Values", "Communication", "Ambition"];

const personas: Persona[] = [
  {
    id: "founder",
    name: "Maya",
    archetype: "28 · Startup founder",
    traits: { warmth: 0.55, ambition: 0.96, structure: 0.6, spontaneity: 0.45, depth: 0.82 },
    flag: "Relentless when they care",
    friction: "Forgets to rest — and to mention it",
    lines: {
      Values: [
        "I protect creative momentum the way some people protect their weekends — fiercely, unreasonably.",
        "Depth over noise. If a conversation isn't going somewhere, I get twitchy."
      ],
      Communication: [
        "I'm direct when it matters, then apologetic about being direct roughly four seconds later.",
        "Tell me the problem early. I can fix almost anything except a surprise."
      ],
      Ambition: [
        "Rest is a feature I keep meaning to install.",
        "I want to build something that outlives my attention span. Tall order, I know."
      ]
    }
  },
  {
    id: "poet",
    name: "Daniel",
    archetype: "31 · Writer",
    traits: { warmth: 0.85, ambition: 0.35, structure: 0.35, spontaneity: 0.55, depth: 0.95 },
    flag: "Makes ordinary moments feel chosen",
    friction: "Can drift off into their own head",
    lines: {
      Values: [
        "A person is just a collection of the things they pay attention to.",
        "Consistency is the most underrated form of romance."
      ],
      Communication: [
        "I'll reassure you before you ask — sometimes before you've even worried.",
        "I say what I mean, eventually, in roughly the third draft."
      ],
      Ambition: [
        "My ambition is quieter: a good life, well noticed.",
        "I'd trade a promotion for a perfect Sunday, and I'd do it twice."
      ]
    }
  },
  {
    id: "realist",
    name: "Sara",
    archetype: "30 · Barrister",
    traits: { warmth: 0.55, ambition: 0.55, structure: 0.92, spontaneity: 0.2, depth: 0.65 },
    flag: "Reliable to the decimal point",
    friction: "Allergic to the grand romantic risk",
    lines: {
      Values: [
        "Grand gestures are lovely. Showing up on a Tuesday is lovelier.",
        "I trust patterns, not promises."
      ],
      Communication: [
        "I'll tell you the truth — I'll just pick a kind hour to do it.",
        "Ambiguity is expensive. I prefer to pay in clarity."
      ],
      Ambition: [
        "I want enough, and I'm suspicious of people who can't define it.",
        "Stability isn't boring. Have you tried chaos? Exhausting."
      ]
    }
  },
  {
    id: "adventurer",
    name: "Theo",
    archetype: "33 · Documentary director",
    traits: { warmth: 0.6, ambition: 0.6, structure: 0.2, spontaneity: 0.96, depth: 0.5 },
    flag: "Keeps life feeling new",
    friction: "Gets restless when things go still",
    lines: {
      Values: [
        "Novelty is oxygen. Routine is a slow puncture.",
        "I fall for curiosity faster than good looks."
      ],
      Communication: [
        "I'll text you a plan at midnight and mean every word of it.",
        "Let's argue while hiking — conflict resolves faster uphill."
      ],
      Ambition: [
        "My five-year plan is to still be surprising myself.",
        "I collect experiences the way other people collect savings."
      ]
    }
  },
  {
    id: "caregiver",
    name: "Aisha",
    archetype: "27 · Junior doctor",
    traits: { warmth: 0.96, ambition: 0.4, structure: 0.7, spontaneity: 0.35, depth: 0.75 },
    flag: "Steady, generous, fully present",
    friction: "Gives until the tank runs empty",
    lines: {
      Values: [
        "Love, to me, is logistics done tenderly.",
        "I notice the small things — mostly because the small things are everything."
      ],
      Communication: [
        "I'd rather over-communicate than leave you wondering.",
        "Tell me you're stressed and I've already made tea."
      ],
      Ambition: [
        "My ambition is a home that feels like an exhale.",
        "I want us both to grow — preferably in the same direction."
      ]
    }
  },
  {
    id: "skeptic",
    name: "Jonah",
    archetype: "32 · VC analyst",
    traits: { warmth: 0.45, ambition: 0.6, structure: 0.75, spontaneity: 0.35, depth: 0.8 },
    flag: "Fiercely loyal once convinced",
    friction: "Tests people before trusting them",
    lines: {
      Values: [
        "I like you. I'm just contractually obligated to look for the catch.",
        "Vulnerability on a first date? Bold. I respect it, and I'm taking notes."
      ],
      Communication: [
        "I ask a lot of questions — it's affection disguised as cross-examination.",
        "I'll believe the feelings once the data agrees."
      ],
      Ambition: [
        "I want a partner, not a project. Subtle but important distinction.",
        "Big dreams are fine. Show me the version that survives a bad week."
      ]
    }
  }
];

function hash(value: string) {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) >>> 0;
  }
  return total;
}

type ScriptLine = { side: "left" | "right"; name: string; topic: Topic; text: string };

function buildScript(a: Persona, b: Persona): ScriptLine[] {
  const seedA = hash(a.id + b.id);
  const seedB = hash(b.id + a.id);
  const script: ScriptLine[] = [];

  topics.forEach((topic, index) => {
    const aLines = a.lines[topic];
    const bLines = b.lines[topic];
    script.push({
      side: "left",
      name: a.name,
      topic,
      text: aLines[(seedA + index) % aLines.length]
    });
    script.push({
      side: "right",
      name: b.name,
      topic,
      text: bLines[(seedB + index) % bLines.length]
    });
  });

  return script;
}

type Reading = {
  score: number;
  tag: string;
  verdict: string;
  greenFlags: string[];
  friction: string;
};

function computeReading(a: Persona, b: Persona): Reading {
  if (a.id === b.id) {
    return {
      score: 71,
      tag: "A study in self-love",
      verdict: "Suspiciously high. This is just narcissism with extra steps.",
      greenFlags: [a.flag, "Unshakeable shared taste"],
      friction: "Two of you, zero people to do the dishes"
    };
  }

  const ta = a.traits;
  const tb = b.traits;
  const sharedDepth = 1 - Math.abs(ta.depth - tb.depth);
  const warmth = (ta.warmth + tb.warmth) / 2;
  const spark = Math.abs(ta.spontaneity - tb.spontaneity); // opposites add a little electricity
  const structureFit = 1 - Math.abs(ta.structure - tb.structure);
  const intensityClash = Math.max(0, (ta.ambition + tb.ambition) / 2 - 0.7) * 1.4;

  const raw =
    0.32 * sharedDepth +
    0.24 * warmth +
    0.18 * spark +
    0.18 * structureFit +
    0.08 -
    0.22 * intensityClash;

  const score = Math.max(58, Math.min(97, Math.round(58 + raw * 42)));

  let tag = "Slow-burn";
  if (ta.ambition > 0.8 && tb.ambition > 0.8) tag = "Power couple (if they ever sync calendars)";
  else if (spark > 0.45) tag = "Opposites, attracting";
  else if (warmth > 0.8) tag = "Soft landing";
  else if (ta.structure > 0.7 && tb.structure > 0.7) tag = "Quietly unbreakable";

  let verdict = "Combustible — thrilling for a week, exhausting by month two.";
  if (score >= 90) verdict = "Dangerously aligned. Cancel your evening plans.";
  else if (score >= 82) verdict = "Strong signal. This one earns a real table for two.";
  else if (score >= 73) verdict = "Promising, with just enough friction to keep it interesting.";
  else if (score >= 65) verdict = "Intriguing tension — could go either way, which is the fun part.";

  const moodier = ta.ambition - ta.warmth >= tb.ambition - tb.warmth ? a : b;

  return {
    score,
    tag,
    verdict,
    greenFlags: [a.flag, b.flag],
    friction: moodier.friction
  };
}

function SpeakerMark({ side }: { side: "left" | "right" }) {
  const color = side === "left" ? "hsl(40 33% 94%)" : "hsl(350 30% 58%)";
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-paper/25 bg-ink">
      <svg width="20" height="14" viewBox="0 0 26 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7" stroke={color} strokeWidth="1.2" opacity="0.95" />
        <circle cx="17" cy="9" r="7" stroke={color} strokeWidth="1.2" opacity="0.55" />
      </svg>
    </span>
  );
}

function PersonaPicker({
  label,
  options,
  selectedId,
  onSelect,
  disabledId
}: {
  label: string;
  options: Persona[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabledId?: string;
}) {
  const selected = options.find((p) => p.id === selectedId);

  return (
    <div>
      <p className="eyebrow text-muted-foreground">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((persona) => {
          const active = persona.id === selectedId;
          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => onSelect(persona.id)}
              className={
                active
                  ? "rounded-full border border-foreground bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-colors"
                  : "rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-claret/40 hover:text-foreground"
              }
            >
              {persona.name}
              {persona.id === disabledId ? " ·" : ""}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="mt-2 text-xs text-muted-foreground">{selected.archetype}</p>
      )}
    </div>
  );
}

export function Salon() {
  const [leftId, setLeftId] = useState("founder");
  const [rightId, setRightId] = useState("poet");
  const [phase, setPhase] = useState<"idle" | "meeting" | "reveal">("idle");
  const [activeIndex, setActiveIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const left = personas.find((p) => p.id === leftId) ?? personas[0];
  const right = personas.find((p) => p.id === rightId) ?? personas[1];

  const script = useMemo(() => buildScript(left, right), [left, right]);
  const reading = useMemo(() => computeReading(left, right), [left, right]);

  const start = useCallback(() => {
    setActiveIndex(0);
    setCharCount(0);
    setDisplayScore(0);
    setPhase("meeting");
  }, []);

  // Typewriter driver
  useEffect(() => {
    if (phase !== "meeting") return;
    const line = script[activeIndex];
    if (!line) return;

    if (charCount === 0) {
      const think = window.setTimeout(() => setCharCount(1), 420);
      return () => window.clearTimeout(think);
    }

    if (charCount < line.text.length) {
      const tick = window.setTimeout(() => setCharCount((c) => c + 1), 16);
      return () => window.clearTimeout(tick);
    }

    const advance = window.setTimeout(() => {
      if (activeIndex + 1 < script.length) {
        setActiveIndex((index) => index + 1);
        setCharCount(0);
      } else {
        setPhase("reveal");
      }
    }, 620);
    return () => window.clearTimeout(advance);
  }, [phase, activeIndex, charCount, script]);

  // Score count-up
  useEffect(() => {
    if (phase !== "reveal") return;
    const target = reading.score;
    const duration = 1100;
    const startTime = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [phase, reading.score]);

  // Keep transcript scrolled to the latest line
  useEffect(() => {
    if (phase === "meeting" && transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [phase, activeIndex, charCount]);

  const isBusy = phase === "meeting";

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
      {/* Controls */}
      <div>
        <p className="font-display text-sm italic text-claret">Live demo</p>
        <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.05] tracking-tightish text-balance">
          Pick two people. Watch their shadows meet.
        </h2>
        <p className="mt-5 max-w-md text-[15px] leading-7 text-muted-foreground">
          These are example members. Choose any two and let their shadows have the
          conversation — values, communication, ambition — exactly the way yours
          would. In a few seconds you&apos;ll see where they click and where the
          sparks fly.
        </p>

        <div className="mt-8 space-y-6">
          <PersonaPicker
            label="First person"
            options={personas}
            selectedId={leftId}
            onSelect={(id) => {
              setLeftId(id);
              setPhase("idle");
            }}
            disabledId={rightId}
          />
          <PersonaPicker
            label="Second person"
            options={personas}
            selectedId={rightId}
            onSelect={(id) => {
              setRightId(id);
              setPhase("idle");
            }}
            disabledId={leftId}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button onClick={start} disabled={isBusy}>
            {phase === "idle" ? "Introduce them" : isBusy ? "Introducing…" : "Run it again"}
            {!isBusy && <Sparkles className="h-4 w-4" />}
          </Button>
          {phase === "reveal" && (
            <button
              type="button"
              onClick={start}
              className="link-underline text-sm text-foreground"
            >
              <RefreshCw className="h-4 w-4" /> Again
            </button>
          )}
        </div>
      </div>

      {/* Stage */}
      <div className="bg-ink p-6 text-paper sm:p-8">
        <div className="flex items-center justify-between">
          <p className="eyebrow text-paper/45">
            {phase === "reveal" ? "The reading" : "Live introduction"}
          </p>
          <div className="flex items-center gap-2 text-xs text-paper/55">
            <span
              className={
                isBusy
                  ? "h-1.5 w-1.5 rounded-full bg-claret"
                  : "h-1.5 w-1.5 rounded-full bg-paper/30"
              }
            />
            {left.name} <span className="text-paper/30">×</span> {right.name}
          </div>
        </div>

        {/* Two representatives */}
        <div className="relative mt-7 flex items-center justify-between gap-6">
          <div className="absolute left-12 right-12 top-1/2 h-px bg-paper/15" />
          <motion.div
            className="absolute left-12 right-12 top-1/2 h-px origin-left bg-claret"
            animate={
              isBusy
                ? { scaleX: [0.1, 1, 0.1], opacity: [0.3, 1, 0.3] }
                : { scaleX: 0.12, opacity: 0.4 }
            }
            transition={{ duration: 2.4, repeat: isBusy ? Infinity : 0, ease: "easeInOut" }}
          />
          {[left, right].map((persona, index) => (
            <div key={persona.id} className="relative z-10 flex flex-col items-center gap-2 text-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full border border-paper/25 bg-ink"
                style={index === 1 ? { boxShadow: "0 0 24px rgba(176,92,112,0.45)" } : undefined}
              >
                <svg width="26" height="18" viewBox="0 0 26 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="7" stroke="hsl(40 33% 94%)" strokeWidth="1.1" opacity={index === 0 ? 0.95 : 0.6} />
                  <circle cx="17" cy="9" r="7" stroke="hsl(350 30% 58%)" strokeWidth="1.1" opacity={index === 1 ? 0.95 : 0.6} />
                </svg>
              </span>
              <span className="text-xs text-paper/70">{persona.name}</span>
            </div>
          ))}
        </div>

        {/* Transcript / reveal */}
        {phase === "idle" && (
          <div className="mt-7 border-t border-paper/15 pt-6 text-sm leading-7 text-paper/55">
            Press <span className="text-paper">Introduce them</span> and their
            representatives will talk through values, communication, and ambition —
            then deliver a verdict.
          </div>
        )}

        {phase !== "idle" && (
          <div
            ref={transcriptRef}
            className="mt-7 max-h-[300px] space-y-4 overflow-y-auto border-t border-paper/15 pt-6"
          >
            {script.slice(0, activeIndex + (phase === "reveal" ? script.length : 1)).map((line, index) => {
              const isActive = phase === "meeting" && index === activeIndex;
              const text = isActive ? line.text.slice(0, charCount) : line.text;
              return (
                <motion.div
                  key={`${index}-${line.text}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-3"
                >
                  <SpeakerMark side={line.side} />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-paper/40">
                      {line.name} · {line.topic}
                    </p>
                    <p className="mt-1 font-display text-[16px] leading-7 text-paper/90">
                      {text}
                      {isActive && <span className="ml-0.5 inline-block animate-pulse">▍</span>}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Reveal */}
        {phase === "reveal" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-7 border-t border-paper/15 pt-6"
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-paper/45">Compatibility</p>
                <p className="mt-2 font-display text-6xl font-light leading-none tracking-tighter2">
                  {displayScore}
                  <span className="align-top text-2xl text-paper/50">%</span>
                </p>
              </div>
              <span className="rounded-full border border-paper/25 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-paper/70">
                {reading.tag}
              </span>
            </div>
            <p className="mt-4 font-display text-lg font-light italic text-paper/90">
              &ldquo;{reading.verdict}&rdquo;
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="border border-paper/15 p-4">
                <p className="eyebrow text-paper/40">Green flags</p>
                <ul className="mt-2 space-y-1 text-sm text-paper/80">
                  {reading.greenFlags.map((flag) => (
                    <li key={flag}>— {flag}</li>
                  ))}
                </ul>
              </div>
              <div className="border border-paper/15 p-4">
                <p className="eyebrow text-paper/40">Tread gently</p>
                <p className="mt-2 text-sm text-paper/80">{reading.friction}</p>
              </div>
            </div>
            <a
              href="/create-shadow"
              className="link-underline mt-6 inline-flex text-sm text-paper"
            >
              Now do it for real <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
