"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Moon,
  Navigation,
  RotateCcw,
  Settings2,
  Sparkles,
  X
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ETHNICITY_OPTIONS,
  INDUSTRY_OPTIONS,
  lastRunAt,
  nearbyMatches,
  shadowsInArea,
  type Ethnicity,
  type Industry,
  type NearbyMatch
} from "@/lib/discover-data";
import {
  computeSmartDate,
  type PersonLocation,
  type SmartDateSuggestion
} from "@/lib/date-suggestion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Filters = {
  maxDistance: number;
  minAge: number;
  maxAge: number;
  minScore: number;
  ethnicities: Ethnicity[];
  industries: Industry[];
};

const DEFAULT_FILTERS: Filters = {
  maxDistance: 10,
  minAge: 18,
  maxAge: 50,
  minScore: 0,
  ethnicities: [],
  industries: []
};

const DEFAULT_USER_LOC: PersonLocation = { home: "", work: "" };

function filtersActive(f: Filters) {
  return (
    f.maxDistance !== DEFAULT_FILTERS.maxDistance ||
    f.minAge !== DEFAULT_FILTERS.minAge ||
    f.maxAge !== DEFAULT_FILTERS.maxAge ||
    f.minScore !== DEFAULT_FILTERS.minScore ||
    f.ethnicities.length > 0 ||
    f.industries.length > 0
  );
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function RangeSlider({
  label, min, max, step = 1, value, onChange,
  format = (v: number) => String(v)
}: {
  label: string; min: number; max: number; step?: number;
  value: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="eyebrow text-muted-foreground">{label}</label>
        <span className="text-sm tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-0.5 w-full cursor-pointer appearance-none rounded-none bg-border accent-claret"
      />
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

function MultiSelect<T extends string>({
  label, options, selected, onChange
}: {
  label: string; options: readonly T[]; selected: T[]; onChange: (v: T[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const toggle = (opt: T) =>
    onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
  const visible = expanded ? options : options.slice(0, 5);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="eyebrow text-muted-foreground">{label}</p>
        {selected.length > 0 && (
          <button onClick={() => onChange([])} className="text-[10px] text-claret hover:underline">Clear</button>
        )}
      </div>
      <div className="mt-3 space-y-1.5">
        {visible.map((opt) => (
          <button key={opt} onClick={() => toggle(opt)}
            className="flex w-full items-center gap-3 py-1 text-left text-sm text-muted-foreground transition hover:text-foreground"
          >
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center border ${selected.includes(opt) ? "border-claret bg-claret" : "border-border"}`}>
              {selected.includes(opt) && <Check className="h-2.5 w-2.5 text-paper" />}
            </span>
            {opt}
          </button>
        ))}
        {options.length > 5 && (
          <button onClick={() => setExpanded((e) => !e)}
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> {options.length - 5} more</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Location inputs ──────────────────────────────────────────────────────────

function LocationSummary({
  value, onChange
}: {
  value: PersonLocation; onChange: (v: PersonLocation) => void;
}) {
  const hasData = Boolean(value.home.trim() || value.work.trim());
  const [editing, setEditing] = useState(!hasData);

  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5 text-claret" />
          <p className="eyebrow text-muted-foreground">Your area</p>
        </div>
        {hasData && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] text-claret hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {!editing && hasData && (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Suggesting dates around{" "}
          <span className="text-foreground">{value.home || "—"}</span>
          {value.work ? <> and <span className="text-foreground">{value.work}</span></> : null}.
          <span className="mt-1 block text-xs text-muted-foreground/70">
            Set when you built your shadow.
          </span>
        </p>
      )}

      {editing && (
        <>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Where you live and work — so we can suggest dates that are convenient for both of you.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="eyebrow text-muted-foreground">I live in</label>
              <input
                value={value.home}
                onChange={(e) => onChange({ ...value, home: e.target.value })}
                placeholder="e.g. Battersea"
                className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-foreground"
              />
            </div>
            <div>
              <label className="eyebrow text-muted-foreground">I work in / near</label>
              <input
                value={value.work}
                onChange={(e) => onChange({ ...value, work: e.target.value })}
                placeholder="e.g. City of London"
                className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-foreground"
              />
            </div>
          </div>
          <button
            onClick={() => setEditing(false)}
            className="mt-3 text-xs text-claret hover:underline"
          >
            Done
          </button>
        </>
      )}
    </div>
  );
}

// ─── Filter panel ──────────────────────────────────────────────────────────────

function FilterPanel({
  filters, onChange, onReset
}: {
  filters: Filters; onChange: (f: Filters) => void; onReset: () => void;
}) {
  const set = <K extends keyof Filters>(key: K, val: Filters[K]) => onChange({ ...filters, [key]: val });
  return (
    <aside className="space-y-7 border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-light">Filters</p>
        {filtersActive(filters) && (
          <button onClick={onReset} className="flex items-center gap-1.5 text-xs text-claret hover:underline">
            <RotateCcw className="h-3 w-3" /> Reset all
          </button>
        )}
      </div>
      <div className="border-t border-border pt-6 space-y-6">
        <RangeSlider label="Distance" min={0.5} max={10} step={0.5} value={filters.maxDistance}
          onChange={(v) => set("maxDistance", v)} format={(v) => `${v} mi`} />
        <div>
          <div className="flex items-baseline justify-between">
            <p className="eyebrow text-muted-foreground">Age range</p>
            <span className="text-sm tabular-nums">{filters.minAge}–{filters.maxAge}</span>
          </div>
          <div className="mt-3 space-y-3">
            <input type="range" min={18} max={filters.maxAge - 1} value={filters.minAge}
              onChange={(e) => set("minAge", Number(e.target.value))}
              className="h-0.5 w-full cursor-pointer appearance-none rounded-none bg-border accent-claret" />
            <input type="range" min={filters.minAge + 1} max={60} value={filters.maxAge}
              onChange={(e) => set("maxAge", Number(e.target.value))}
              className="h-0.5 w-full cursor-pointer appearance-none rounded-none bg-border accent-claret" />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>18</span><span>60</span>
          </div>
        </div>
        <RangeSlider label="Min compatibility" min={0} max={100} step={5}
          value={filters.minScore} onChange={(v) => set("minScore", v)} format={(v) => `${v}%`} />
      </div>
      <div className="border-t border-border pt-6">
        <MultiSelect label="Ethnicity" options={ETHNICITY_OPTIONS} selected={filters.ethnicities}
          onChange={(v) => set("ethnicities", v as Ethnicity[])} />
      </div>
      <div className="border-t border-border pt-6">
        <MultiSelect label="Industry" options={INDUSTRY_OPTIONS} selected={filters.industries}
          onChange={(v) => set("industries", v as Industry[])} />
      </div>
    </aside>
  );
}

// ─── Score dial ───────────────────────────────────────────────────────────────

function ScoreDial({ score }: { score: number }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const arc = (score / 100) * circ;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="hsl(34 16% 84%)" strokeWidth="4" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke="hsl(350 30% 32%)" strokeWidth="4"
          strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-light leading-none tracking-tighter">{score}</span>
        <span className="text-[10px] text-muted-foreground">%</span>
      </div>
    </div>
  );
}

// ─── Smart date card ──────────────────────────────────────────────────────────

function SmartDateCard({
  match,
  userLoc,
  compact = false
}: {
  match: NearbyMatch;
  userLoc: PersonLocation;
  compact?: boolean;
}) {
  const suggestion: SmartDateSuggestion = useMemo(
    () =>
      computeSmartDate(userLoc, {
        home: match.location,
        work: match.workLocation
      }),
    [userLoc, match]
  );

  const hasUserData = userLoc.home.trim() || userLoc.work.trim();

  return (
    <div className={compact ? "border border-border bg-background p-4" : "bg-ink p-5 text-paper"}>
      <div className="flex items-center justify-between gap-2">
        <p className={`eyebrow ${compact ? "text-muted-foreground" : "text-paper/45"}`}>
          Suggested first date
        </p>
        {hasUserData && (
          <span className={`flex items-center gap-1 text-[10px] ${compact ? "text-claret" : "text-paper/50"}`}>
            <Navigation className="h-2.5 w-2.5" /> Smart pick
          </span>
        )}
      </div>

      <p className={`mt-2 font-display font-light ${compact ? "text-sm" : "text-xl"}`}>
        {suggestion.venue.name}
      </p>

      {!compact && (
        <>
          <p className={`mt-1.5 text-sm leading-6 ${compact ? "text-muted-foreground" : "text-paper/65"}`}>
            {suggestion.venue.tagline}
          </p>

          {/* Geographic reasoning */}
          <div className={`mt-4 border-t pt-4 ${compact ? "border-border" : "border-paper/15"}`}>
            <p className={`text-xs leading-5 ${compact ? "text-muted-foreground" : "text-paper/55"}`}>
              {hasUserData ? suggestion.reasoning : "Add your location above for a smarter suggestion."}
            </p>
            {hasUserData && suggestion.commuteNote && (
              <p className={`mt-2 text-xs leading-5 italic ${compact ? "text-muted-foreground" : "text-paper/45"}`}>
                {suggestion.commuteNote}
              </p>
            )}
          </div>

          {/* Distance indicators */}
          {hasUserData && (
            <div className={`mt-4 flex gap-6 text-xs ${compact ? "text-muted-foreground" : "text-paper/50"}`}>
              <div>
                <span className="block font-medium">You</span>
                <span>{suggestion.distanceFromYou} from here</span>
              </div>
              <div>
                <span className="block font-medium">{match.name}</span>
                <span>{suggestion.distanceFromThem} from here</span>
              </div>
            </div>
          )}
        </>
      )}

      {compact && (
        <p className="mt-1 text-xs text-muted-foreground">{suggestion.venue.address}</p>
      )}

      {!compact && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-paper/40">
          <MapPin className="h-3 w-3" /> {suggestion.venue.address}
        </div>
      )}
    </div>
  );
}

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({
  match, userLoc, onOpen
}: {
  match: NearbyMatch; userLoc: PersonLocation; onOpen: () => void;
}) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="border border-border bg-card"
    >
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-lg font-light">{match.name}, {match.age}</p>
              {match.source === "overnight" && (
                <Badge tone="neutral" className="gap-1">
                  <Moon className="h-2.5 w-2.5" /> {match.metAt}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              Lives in {match.location} · works in {match.workLocation} · {match.distanceMiles} mi away
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{match.occupation} · {match.ethnicity}</p>
          </div>
          <ScoreDial score={match.score} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {match.traits.map((t) => (
            <span key={t} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="eyebrow text-muted-foreground">{match.tag}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">{match.verdict}</p>
        <div className="mt-4">
          <SmartDateCard match={match} userLoc={userLoc} compact />
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={onOpen}>
            Full reading <ArrowRight className="h-4 w-4" />
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/dashboard/field/${match.id}`}>Let them meet</Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Reading drawer ───────────────────────────────────────────────────────────

function ReadingDrawer({
  match, userLoc, onClose
}: {
  match: NearbyMatch; userLoc: PersonLocation; onClose: () => void;
}) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto border border-border bg-card shadow-2xl sm:max-h-[85vh]"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <Badge tone="blue" className="mb-3">Overnight reading</Badge>
            <h2 className="font-display text-2xl font-light tracking-tightish">
              {match.name}, {match.age}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {match.occupation} · {match.ethnicity}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Lives in {match.location}
              </span>
              <span className="flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5" /> Works in {match.workLocation}
              </span>
              <span>{match.distanceMiles} mi away · met {match.metAt}</span>
            </div>
          </div>
          <button onClick={onClose}
            className="rounded-full border border-border p-2 text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-center gap-5 border border-border p-5">
            <ScoreDial score={match.score} />
            <div>
              <p className="font-display text-xl font-light">{match.tag}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{match.verdict}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-border p-4">
              <p className="eyebrow text-muted-foreground">Green flags</p>
              <ul className="mt-3 space-y-2">
                {match.greenFlags.map((f) => (
                  <li key={f} className="flex gap-2 text-sm leading-6">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-claret" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border p-4">
              <p className="eyebrow text-muted-foreground">Tread gently</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{match.treadGently}</p>
            </div>
          </div>

          {/* Smart date — full version */}
          <SmartDateCard match={match} userLoc={userLoc} />

          <div className="flex gap-3">
            <Button asChild>
              <Link href={`/dashboard/field/${match.id}`}>
                Let them meet properly <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="secondary" onClick={onClose}>Later</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Area map ─────────────────────────────────────────────────────────────────

function AreaMap({ maxDistance }: { maxDistance: number }) {
  const ratio = maxDistance / 10;
  const dots = nearbyMatches.map((m, i) => {
    const angle = (i / nearbyMatches.length) * 2 * Math.PI - Math.PI / 4;
    const r = (m.distanceMiles / 10) * 110;
    return { ...m, cx: 130 + r * Math.cos(angle), cy: 130 + r * Math.sin(angle) };
  });

  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow text-muted-foreground">Your area</p>
        <span className="text-xs text-muted-foreground">{maxDistance} mi radius</span>
      </div>
      <div className="relative mt-4 overflow-hidden">
        <svg viewBox="0 0 260 260" className="w-full" aria-hidden="true">
          {[0.25, 0.5, 0.75, 1].map((r) => (
            <circle key={r} cx="130" cy="130" r={r * 110} fill="none"
              stroke="hsl(34 16% 84%)" strokeWidth="0.75" strokeDasharray="3 4" />
          ))}
          <circle cx="130" cy="130" r={ratio * 110}
            fill="hsl(350 30% 32% / 0.06)" stroke="hsl(350 30% 32% / 0.25)" strokeWidth="1" />
          {dots.map((d) => {
            const inRange = d.distanceMiles <= maxDistance;
            return (
              <g key={d.id}>
                {inRange && <circle cx={d.cx} cy={d.cy} r="9" fill="hsl(350 30% 32% / 0.15)" />}
                <circle cx={d.cx} cy={d.cy} r="5"
                  fill={inRange ? "hsl(350 30% 32%)" : "hsl(34 16% 84%)"}
                  opacity={inRange ? 0.9 : 0.35} />
              </g>
            );
          })}
          <circle cx="130" cy="130" r="6" fill="hsl(var(--ink))" />
          <circle cx="130" cy="130" r="3" fill="hsl(var(--paper))" />
          {[1, 5, 10].map((mi) => (
            <text key={mi} x={130 + (mi / 10) * 110 - 6} y="136" fontSize="7" fill="hsl(34 16% 60%)">{mi}mi</text>
          ))}
        </svg>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-claret" /> In range</div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-border bg-background" /> Outside range</div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "shadow_user_location";

export default function DiscoverPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [open, setOpen] = useState<NearbyMatch | null>(null);
  const [userLoc, setUserLoc] = useState<PersonLocation>(DEFAULT_USER_LOC);

  // Persist user location in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUserLoc(JSON.parse(saved) as PersonLocation);
    } catch { /* ignore */ }
  }, []);

  const handleLocChange = (loc: PersonLocation) => {
    setUserLoc(loc);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)); } catch { /* ignore */ }
  };

  const filtered = useMemo(() => {
    return nearbyMatches.filter((m) => {
      if (m.distanceMiles > filters.maxDistance) return false;
      if (m.age < filters.minAge || m.age > filters.maxAge) return false;
      if (m.score < filters.minScore) return false;
      if (filters.ethnicities.length > 0 && !filters.ethnicities.includes(m.ethnicity)) return false;
      if (filters.industries.length > 0 && !filters.industries.includes(m.industry)) return false;
      return true;
    });
  }, [filters]);

  const best = filtered.reduce<NearbyMatch | null>(
    (top, m) => (!top || m.score > top.score ? m : top), null
  );
  const rest = filtered.filter((m) => m.id !== best?.id);
  const active = filtersActive(filters);

  // Best match's smart suggestion (for the hero)
  const bestSuggestion: SmartDateSuggestion | null = useMemo(
    () => best ? computeSmartDate(userLoc, { home: best.location, work: best.workLocation }) : null,
    [best, userLoc]
  );

  const hasUserLoc = userLoc.home.trim() || userLoc.work.trim();

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge tone="blue">Discover</Badge>
          <h1 className="mt-5 font-display text-4xl font-light tracking-tightish">
            Your shadow went out last night.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            While you slept, your representative met {shadowsInArea.toLocaleString()} shadows in your area —
            {" "}{lastRunAt}. {filtered.length} match{filtered.length !== 1 ? "es" : ""} fit your preferences.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {active && (
            <button onClick={() => setFilters(DEFAULT_FILTERS)}
              className="flex items-center gap-1.5 text-sm text-claret hover:underline">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setFiltersOpen((o) => !o)} className="gap-2 lg:hidden">
            <Settings2 className="h-4 w-4" />
            Filters
            {active && <span className="rounded-full bg-claret px-1.5 py-0.5 text-[10px] font-medium text-paper">on</span>}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Mobile filters */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden lg:hidden"
              >
                <div className="space-y-4">
                  <LocationSummary value={userLoc} onChange={handleLocChange} />
                  <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop always visible */}
          <div className="hidden space-y-4 lg:block">
            <LocationSummary value={userLoc} onChange={handleLocChange} />
            <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
            <AreaMap maxDistance={filters.maxDistance} />
          </div>
        </div>

        {/* Main column */}
        <div className="min-w-0 space-y-4">
          {/* Best match hero */}
          {best && bestSuggestion && (
            <motion.div layout className="bg-ink p-6 text-paper sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="eyebrow text-paper/45">
                    <Sparkles className="mr-1 inline-block h-3 w-3" /> Best match tonight
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-light tracking-tightish">
                    {best.name}, {best.age}
                  </h2>
                  <p className="mt-0.5 text-sm text-paper/55">{best.occupation} · {best.ethnicity}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-paper/65">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" /> Lives in {best.location}</span>
                    <span className="flex items-center gap-1"><Navigation className="h-3.5 w-3.5 shrink-0" /> Works in {best.workLocation}</span>
                  </div>
                  <p className="mt-4 max-w-lg font-display text-lg font-light italic text-paper/90">
                    &ldquo;{best.verdict}&rdquo;
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button className="bg-paper text-ink hover:bg-paper/90" onClick={() => setOpen(best)}>
                      See full reading
                    </Button>
                    <Button asChild variant="secondary" className="border-paper/25 text-paper hover:border-paper/50">
                      <Link href={`/dashboard/field/${best.id}`}>Let them meet</Link>
                    </Button>
                  </div>
                </div>
                <ScoreDial score={best.score} />
              </div>

              {/* Smart date suggestion in hero */}
              <div className="mt-7 border-t border-paper/15 pt-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="eyebrow text-paper/45">Suggested first date</p>
                  {hasUserLoc && (
                    <span className="flex items-center gap-1 text-[10px] text-paper/50">
                      <Navigation className="h-2.5 w-2.5" /> Based on your locations
                    </span>
                  )}
                </div>
                <p className="mt-2 font-display text-xl font-light">{bestSuggestion.venue.name}</p>
                <p className="mt-1 text-sm text-paper/65">{bestSuggestion.venue.tagline}</p>
                {hasUserLoc && (
                  <p className="mt-3 text-xs leading-5 text-paper/50">{bestSuggestion.reasoning}</p>
                )}
                {hasUserLoc && bestSuggestion.commuteNote && (
                  <p className="mt-1 text-xs leading-5 italic text-paper/40">{bestSuggestion.commuteNote}</p>
                )}
                {hasUserLoc && (
                  <div className="mt-4 flex gap-6 text-xs text-paper/50">
                    <div><span className="block font-medium">You</span><span>{bestSuggestion.distanceFromYou} from there</span></div>
                    <div><span className="block font-medium">{best.name}</span><span>{bestSuggestion.distanceFromThem} from there</span></div>
                  </div>
                )}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-paper/40">
                  <MapPin className="h-3 w-3" /> {bestSuggestion.venue.address}
                </p>
              </div>
            </motion.div>
          )}

          {/* Match grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {rest.map((match) => (
                <MatchCard key={match.id} match={match} userLoc={userLoc} onOpen={() => setOpen(match)} />
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center border border-dashed border-border py-24 text-center"
            >
              <p className="font-display text-2xl font-light text-muted-foreground">No matches with these filters.</p>
              <p className="mt-3 text-sm text-muted-foreground">Try widening the distance or adjusting preferences.</p>
              <Button variant="secondary" size="sm" className="mt-6" onClick={() => setFilters(DEFAULT_FILTERS)}>
                <RotateCcw className="h-4 w-4" /> Reset filters
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="mt-12 border-t border-border pt-10">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: "01", title: "Your shadow goes out", body: "Every night, your representative quietly meets other shadows in your area — no performance, no small talk. Just signal." },
            { step: "02", title: "They have the conversation", body: "Values, communication, ambition, conflict — the full introduction. Exactly as it would happen if you had sent them yourself." },
            { step: "03", title: "You wake up to the reading", body: "Who they got on with, a compatibility score, and a suggested first date chosen around both your locations." }
          ].map((item) => (
            <div key={item.step} className="border-t-2 border-border pt-5">
              <p className="font-display text-sm italic text-claret">({item.step})</p>
              <p className="mt-3 font-display text-lg font-light">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {open && <ReadingDrawer match={open} userLoc={userLoc} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </div>
  );
}
