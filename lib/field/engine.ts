// Shadow-to-Shadow conversation engine.
//
// A deterministic, staged compatibility protocol. It intentionally does NOT
// run a freeform chat between two language models. Instead it reasons over two
// ShadowProfiles through fixed stages, produces a bounded structured exchange
// of CLAIM / QUESTION / EVIDENCE / CONCERN / RESOLUTION / FOLLOW_UP turns, and
// synthesises a persistent MeetingMemory plus a human-facing ShadowMatchReport.
//
// Being deterministic means it works with no OPENAI_API_KEY (demo mode) and is
// fully unit-testable. An LLM can later be layered on top to make the exchange
// prose richer, but the protocol, scoring, privacy and memory are owned here.

import { computeSmartDate, type PersonLocation } from "../date-suggestion.ts";
import {
  MEETING_STAGES,
  STAGE_LABELS,
  type ConversationRecoveryRating,
  type EmotionalEffect,
  type ExchangeMessage,
  type FieldCandidateResult,
  type FieldNightOptions,
  type FieldNightResult,
  type FirstDateSuggestion,
  type MeetingAgenda,
  type MeetingMemory,
  type MeetingStage,
  type NervousSystemEffect,
  type PreScreenResult,
  type PrivacyLevel,
  type RecommendationStatus,
  type ResidueFeeling,
  type ResonanceReport,
  type ShadowMatchReport,
  type ShadowProfile,
  type StructuredMeetingResult,
  type TraitReaction,
  type TraitReactionValence,
  type TravelFriction
} from "./types.ts";

/** Hard cap on turns per stage — agents never loop generic conversation. */
const MAX_TURNS_PER_STAGE = 8;

// ─── small text utilities ────────────────────────────────────────────────────

function lc(s: string): string {
  return s.toLowerCase();
}

function uniq(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    const key = trimmed.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function tokenize(s: string): string[] {
  return lc(s)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
}

function matchAny(
  values: Array<string | undefined> | undefined,
  needles: string[]
): boolean {
  if (!values) return false;
  return values.some(
    (v) => v != null && needles.some((n) => lc(v).includes(n))
  );
}

function sharedThemes(a: string[] | undefined, b: string[] | undefined): string[] {
  if (!a || !b) return [];
  const bTokens = new Set(b.flatMap(tokenize));
  return uniq(a.filter((item) => tokenize(item).some((t) => bTokens.has(t))));
}

function joinNice(items: string[]): string {
  const cleaned = items.filter(Boolean);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")} and ${cleaned[cleaned.length - 1]}`;
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function nameOf(p: ShadowProfile): string {
  return p.displayName || p.userId;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function pairId(a: string, b: string): string {
  return [a, b].sort().join("__");
}

function gather(
  p: ShadowProfile,
  ...lists: Array<string[] | string | undefined>
): string[] {
  const out: string[] = [];
  for (const list of lists) {
    if (!list) continue;
    if (Array.isArray(list)) out.push(...list);
    else out.push(list);
  }
  return out;
}

// ─── profile predicates (the agent's reasoning primitives) ───────────────────

function needsReassurance(p: ShadowProfile): boolean {
  return matchAny(gather(p, p.emotionalNeeds, p.frustrations), [
    "reassur",
    "consisten",
    "availab",
    "closeness",
    "secure",
    "attention",
    "withdraw"
  ]);
}

function needsIndependence(p: ShadowProfile): boolean {
  return matchAny(
    gather(p, p.emotionalNeeds, p.lifestylePreferences, p.personalityTraits, p.values),
    ["independ", "space", "autonom", "freedom", "own time"]
  );
}

function isAmbitious(p: ShadowProfile): boolean {
  return matchAny(
    gather(p, p.ambitionGoals, p.personalityTraits, p.values, p.frustrations),
    ["ambiti", "driven", "founder", "career", "intens", "build", "work-focused", "workaholic"]
  );
}

function isSpontaneous(p: ShadowProfile): boolean {
  return matchAny(gather(p, p.personalityTraits, p.lifestylePreferences), [
    "spontan",
    "adventur",
    "impulsiv",
    "restless",
    "unpredict"
  ]);
}

function needsPredictability(p: ShadowProfile): boolean {
  return matchAny(
    gather(p, p.lifestylePreferences, p.emotionalNeeds, p.personalityTraits, p.values),
    ["predict", "routine", "calm", "stabil", "structure", "steady", "planned"]
  );
}

function avoidsConflict(p: ShadowProfile): boolean {
  return matchAny(gather(p, p.conflictStyle, p.personalityTraits), [
    "avoid",
    "withdraw",
    "nonconfront",
    "shut down",
    "shuts down",
    "retreat",
    "conflict-averse"
  ]);
}

function directInConflict(p: ShadowProfile): boolean {
  return matchAny(gather(p, p.conflictStyle), [
    "direct",
    "address",
    "confront",
    "talk it out",
    "head-on",
    "head on",
    "open about"
  ]);
}

function movesFast(p: ShadowProfile): boolean {
  return matchAny(gather(p, p.datingPatterns, p.personalityTraits), [
    "intens",
    "fast",
    "all in",
    "all-in",
    "quick",
    "falls hard"
  ]);
}

function movesSlow(p: ShadowProfile): boolean {
  return matchAny(gather(p, p.datingPatterns, p.personalityTraits), [
    "slow",
    "cautious",
    "guard",
    "takes time",
    "wary",
    "wall up"
  ]);
}

function chaotic(p: ShadowProfile): boolean {
  return matchAny(gather(p, p.lifestylePreferences, p.personalityTraits), [
    "chaotic",
    "hectic",
    "unpredict",
    "always busy"
  ]);
}

function wantsCalm(p: ShadowProfile): boolean {
  return matchAny(gather(p, p.lifestylePreferences, p.emotionalNeeds, p.values), [
    "calm",
    "quiet",
    "peace",
    "slow living",
    "stabil"
  ]);
}

function wantsChildren(p: ShadowProfile): boolean | null {
  const text = lc(
    gather(p, p.familyChildrenViews, p.nonNegotiables, p.lookingFor).join(" ")
  );
  if (!text) return null;
  const no =
    /(no kids|no children|child[\s-]?free|don'?t want (kids|children)|doesn'?t want (kids|children)|never want children)/.test(
      text
    );
  const yes =
    /(want[s]? (kids|children)|kids someday|children someday|start a family|wants a family|family-oriented|definitely want)/.test(
      text
    );
  if (no && !yes) return false;
  if (yes && !no) return true;
  return null;
}

// ─── emotional-resonance predicates (how someone *feels* to be around) ───────

function isIntense(p: ShadowProfile): boolean {
  return (
    movesFast(p) ||
    isAmbitious(p) ||
    matchAny(
      gather(p, p.personalityTraits, p.datingPatterns, p.lifestylePreferences, p.frustrations),
      ["intens", "all in", "all-in", "passion", "consumed", "obsess", "high initiative"]
    )
  );
}

function isCalmPresence(p: ShadowProfile): boolean {
  return (
    wantsCalm(p) ||
    needsPredictability(p) ||
    matchAny(gather(p, p.personalityTraits, p.values, p.communicationStyle, p.greenFlags), [
      "ground",
      "steady",
      "stead",
      "calm",
      "measured",
      "even",
      "regulat",
      "stabil",
      "patient"
    ])
  );
}

function isWarm(p: ShadowProfile): boolean {
  return matchAny(
    gather(p, p.personalityTraits, p.greenFlags, p.communicationStyle, p.emotionalNeeds),
    ["warm", "caring", "tender", "kind", "nurtur", "affection", "gentle", "secure"]
  );
}

function isPlayful(p: ShadowProfile): boolean {
  return matchAny(gather(p, p.humourStyle, p.personalityTraits, p.lifestylePreferences), [
    "playful",
    "witty",
    "fun",
    "light",
    "banter",
    "dry",
    "quick",
    "observational",
    "humour",
    "humor",
    "silly"
  ]);
}

function isCurious(p: ShadowProfile): boolean {
  return matchAny(gather(p, p.personalityTraits, p.values, p.ambitionGoals), [
    "curio",
    "inquisit",
    "explor",
    "questioning",
    "learn"
  ]);
}

function isSecureGrounded(p: ShadowProfile): boolean {
  return matchAny(gather(p, p.personalityTraits, p.greenFlags, p.values), [
    "secure",
    "self-aware",
    "ground",
    "self-contained",
    "stead",
    "regulat",
    "settled"
  ]);
}

function intentRank(p: ShadowProfile): number | null {
  const text = lc(gather(p, p.relationshipIntent, p.lookingFor).join(" "));
  if (!text) return null;
  if (/(marriage|life partner|settle|long[\s-]?term|serious|something real|commit)/.test(text)) {
    return 2;
  }
  if (/(casual|fun|fling|hook|no strings|nothing serious|see where)/.test(text)) {
    return 0;
  }
  if (/(dating|open to|relationship)/.test(text)) return 1;
  return null;
}

// ─── non-negotiable conflict detection ───────────────────────────────────────

function detectNonNegotiableConflicts(
  a: ShadowProfile,
  b: ShadowProfile
): string[] {
  const conflicts: string[] = [];
  const A = nameOf(a);
  const B = nameOf(b);

  const aKids = wantsChildren(a);
  const bKids = wantsChildren(b);
  if (aKids !== null && bKids !== null && aKids !== bKids) {
    conflicts.push(
      "Children: one wants children and the other does not — a hard incompatibility."
    );
  }

  const aIntent = intentRank(a);
  const bIntent = intentRank(b);
  if (aIntent !== null && bIntent !== null && Math.abs(aIntent - bIntent) >= 2) {
    conflicts.push(
      "Relationship intent clash: one wants something serious, the other something casual."
    );
  }

  for (const [owner, other, ownerName] of [
    [a, b, A],
    [b, a, B]
  ] as const) {
    for (const nn of owner.nonNegotiables ?? []) {
      const violation = nonNegotiableViolation(nn, other);
      if (violation) {
        conflicts.push(`${ownerName}'s non-negotiable ("${nn}") conflicts — ${violation}`);
      }
    }
  }

  return uniq(conflicts);
}

function nonNegotiableViolation(nn: string, other: ShadowProfile): string | null {
  const n = lc(nn);
  const otherText = lc(
    gather(
      other,
      other.lifestylePreferences,
      other.personalityTraits,
      other.values,
      other.frustrations,
      other.relationshipIntent,
      other.familyChildrenViews
    ).join(" ")
  );

  if (
    /(non[\s-]?smoker|doesn'?t smoke|no smok)/.test(n) &&
    /smok/.test(otherText) &&
    !/(non[\s-]?smoker|no smok|quit)/.test(otherText)
  ) {
    return "the other person appears to smoke.";
  }
  if (/(want|need).*(child|kid|family)/.test(n) && wantsChildren(other) === false) {
    return "the other person does not want children.";
  }
  if (
    /(child[\s-]?free|no (kids|children))/.test(n) &&
    wantsChildren(other) === true
  ) {
    return "the other person wants children.";
  }
  if (
    /(same city|no long[\s-]?distance|must be local)/.test(n) &&
    /(long[\s-]?distance|abroad|different city|relocat)/.test(otherText)
  ) {
    return "the other person may be long-distance.";
  }
  return null;
}

// ─── friction scenarios (shared by stage 3 and scoring) ──────────────────────

type Severity = "low" | "medium" | "high";

interface FrictionScenario {
  scenario: string;
  severity: Severity;
  manageable: boolean;
  whatToUnderstand: string;
  discussTopic: string;
}

function detectFrictionScenarios(
  a: ShadowProfile,
  b: ShadowProfile
): FrictionScenario[] {
  const A = nameOf(a);
  const B = nameOf(b);
  const scenarios: FrictionScenario[] = [];
  const someoneCommunicates = directInConflict(a) || directInConflict(b);

  if ((movesFast(a) && movesSlow(b)) || (movesFast(b) && movesSlow(a))) {
    const fast = movesFast(a) ? A : B;
    const slow = fast === A ? B : A;
    scenarios.push({
      scenario: `${fast} tends to move fast and intensely early; ${slow} needs time to feel safe.`,
      severity: "medium",
      manageable: someoneCommunicates,
      whatToUnderstand: `${fast}'s intensity is not pressure, and ${slow}'s caution is not disinterest.`,
      discussTopic: "What does a comfortable early pace look like for each of you?"
    });
  }

  if ((isAmbitious(a) && needsReassurance(b)) || (isAmbitious(b) && needsReassurance(a))) {
    const driven = isAmbitious(a) && needsReassurance(b) ? A : B;
    const present = driven === A ? B : A;
    scenarios.push({
      scenario: `${driven} is highly work-focused; ${present} needs reliable emotional availability.`,
      severity: "high",
      manageable: someoneCommunicates,
      whatToUnderstand: `Whether ${driven} protects a dependable place for the relationship inside a busy life.`,
      discussTopic: "How do we keep the relationship a priority during intense work periods?"
    });
  }

  if (
    (needsReassurance(a) && needsIndependence(b)) ||
    (needsReassurance(b) && needsIndependence(a))
  ) {
    scenarios.push({
      scenario: "One needs reassurance and closeness; the other needs space and independence.",
      severity: "medium",
      manageable: true,
      whatToUnderstand:
        "Reassurance and autonomy can coexist if both are named instead of assumed.",
      discussTopic: "How do we ask for closeness or space without it feeling like rejection?"
    });
  }

  if (
    (isSpontaneous(a) && needsPredictability(b)) ||
    (isSpontaneous(b) && needsPredictability(a))
  ) {
    scenarios.push({
      scenario: "One is spontaneous; the other needs predictability and plans.",
      severity: "low",
      manageable: true,
      whatToUnderstand: "Spontaneity and structure can complement each other with light planning.",
      discussTopic: "How much of the week feels good to plan versus leave open?"
    });
  }

  if ((chaotic(a) && wantsCalm(b)) || (chaotic(b) && wantsCalm(a))) {
    scenarios.push({
      scenario: "One lives at a chaotic, high-tempo pace; the other wants calm and steadiness.",
      severity: "medium",
      manageable: someoneCommunicates,
      whatToUnderstand: "Whether the calmer person reads chaos as energy or as instability.",
      discussTopic: "What does a restful shared evening look like for each of you?"
    });
  }

  if (
    (avoidsConflict(a) && directInConflict(b)) ||
    (avoidsConflict(b) && directInConflict(a))
  ) {
    scenarios.push({
      scenario: "One avoids conflict and withdraws; the other wants to address things directly.",
      severity: "high",
      manageable: false,
      whatToUnderstand:
        "Repair will stall unless the avoider feels safe enough to stay in the conversation.",
      discussTopic: "When something is wrong, how do we both stay in the room long enough to repair it?"
    });
  }

  return scenarios;
}

// ─── privacy: disclose high-level patterns, never raw sensitive material ─────

interface SafeDisclosure {
  text: string;
  privacyLevel: PrivacyLevel;
  boundaryHit: string | null;
}

function discloseEmotionalPattern(p: ShadowProfile): SafeDisclosure {
  const name = nameOf(p);
  const dnd = (p.doNotDisclose ?? []).map(lc).filter(Boolean);
  const notes = p.sourceNotes ?? [];
  const touchedSensitive = notes.some((note) =>
    dnd.some((d) => lc(note).includes(d))
  );

  const needs = p.emotionalNeeds ?? [];
  const safe = needs.length
    ? `${name} has learned that they need ${joinNice(needs.slice(0, 2).map(lc))}.`
    : `${name} is still working out what they need most emotionally.`;

  return {
    text: safe,
    privacyLevel: touchedSensitive ? "sensitive" : "shareable",
    boundaryHit: touchedSensitive
      ? "Paraphrased a sensitive personal history; disclosed only the high-level emotional need."
      : null
  };
}

// ─── emotional resonance (the heart of Shadow's scoring) ─────────────────────
//
// Resonance is NOT about shared hobbies or overlapping interests. It is about
// how two nervous systems affect each other: does the other person regulate or
// activate you, is curiosity left over, does the conversation recover after an
// awkward beat, what remains emotionally once it ends. The deterministic logic
// below reuses the same profile predicates the rest of the engine reasons over.

interface ResonanceDynamic {
  /** Whose trait this is. */
  sourceName: string;
  /** The source trait being reacted to. */
  trait: string;
  /** How that trait lands in the other person. */
  reaction: string;
  valence: TraitReactionValence;
  effects: EmotionalEffect[];
  ns: NervousSystemEffect[];
}

/**
 * How `source`'s emotional traits land in `observer`. Direction matters: the
 * same intensity that one person finds exciting can overwhelm another.
 */
function dynamicsFromSource(
  source: ShadowProfile,
  observer: ShadowProfile,
  sourceName: string,
  observerName: string
): ResonanceDynamic[] {
  const out: ResonanceDynamic[] = [];
  const add = (
    trait: string,
    reaction: string,
    valence: TraitReactionValence,
    effects: EmotionalEffect[],
    ns: NervousSystemEffect[]
  ) => out.push({ sourceName, trait, reaction, valence, effects, ns });

  if (isCalmPresence(source) && isIntense(observer)) {
    add(
      `${sourceName}'s calm, grounded presence`,
      `appears to regulate ${observerName}'s intensity rather than inflame it`,
      "positive",
      ["calming", "grounding"],
      ["grounded", "relaxed"]
    );
  }

  if (isIntense(source) && needsReassurance(observer)) {
    const cushioned = isSecureGrounded(observer) || isCalmPresence(observer);
    add(
      `${sourceName}'s intensity`,
      cushioned
        ? `is a lot, but ${observerName} seems steady enough to meet it instead of being flooded`
        : `may overwhelm ${observerName}, who needs steadiness more than heat`,
      cushioned ? "mixed" : "negative",
      cushioned ? ["addictive/intense"] : ["stressful", "addictive/intense"],
      cushioned ? ["activated"] : ["activated", "anxious"]
    );
  }

  if (isWarm(source) && needsReassurance(observer)) {
    add(
      `${sourceName}'s warmth`,
      `seems to soothe ${observerName}'s need for emotional consistency`,
      "positive",
      ["safe", "calming"],
      ["safe", "relaxed"]
    );
  }

  if (chaotic(source) && wantsCalm(observer)) {
    add(
      `${sourceName}'s high-tempo, chaotic pace`,
      `may unsettle ${observerName}, who instinctively reaches for calm`,
      "negative",
      ["stressful", "confusing"],
      ["activated", "anxious"]
    );
  }

  if (needsIndependence(source) && needsReassurance(observer)) {
    add(
      `${sourceName}'s need for space`,
      `could read as distance to ${observerName} unless it is named out loud`,
      "mixed",
      ["confusing"],
      ["anxious"]
    );
  }

  if ((isSpontaneous(source) || isPlayful(source)) && (isSpontaneous(observer) || isIntense(observer))) {
    add(
      `${sourceName}'s spontaneous, playful energy`,
      `seems to light ${observerName} up rather than drain them`,
      "positive",
      ["energising", "exciting", "playful"],
      ["playful"]
    );
  }

  return out;
}

/** Symmetric dynamics that belong to the pair rather than to one side. */
function mutualDynamics(
  a: ShadowProfile,
  b: ShadowProfile,
  nameA: string,
  nameB: string
): ResonanceDynamic[] {
  const out: ResonanceDynamic[] = [];

  if (directInConflict(a) && directInConflict(b)) {
    out.push({
      sourceName: `${nameA} & ${nameB}`,
      trait: "both being direct when something is wrong",
      reaction: "makes it feel safe to raise hard things before they calcify",
      valence: "positive",
      effects: ["safe", "grounding"],
      ns: ["safe", "grounded"]
    });
  }

  if ((avoidsConflict(a) && directInConflict(b)) || (avoidsConflict(b) && directInConflict(a))) {
    const avoider = avoidsConflict(a) ? nameA : nameB;
    const direct = avoider === nameA ? nameB : nameA;
    out.push({
      sourceName: `${avoider} ↔ ${direct}`,
      trait: "one avoids conflict while the other confronts it",
      reaction: `${direct}'s directness can feel confronting to ${avoider}, who tends to withdraw`,
      valence: "negative",
      effects: ["stressful", "confusing"],
      ns: ["activated", "judged"]
    });
  }

  if (isCurious(a) && isCurious(b)) {
    out.push({
      sourceName: `${nameA} & ${nameB}`,
      trait: "shared curiosity",
      reaction: "keeps pulling each one toward the next question rather than running dry",
      valence: "positive",
      effects: ["exciting", "energising"],
      ns: ["playful"]
    });
  }

  return out;
}

const POSITIVE_NS: NervousSystemEffect[] = ["relaxed", "grounded", "playful", "safe"];
const NEGATIVE_NS: NervousSystemEffect[] = ["anxious", "judged", "performative"];

const RECOVERY_SCORE: Record<ConversationRecoveryRating, number> = {
  "easy recovery": 90,
  "playful recovery": 84,
  "forced recovery": 55,
  "unresolved tension": 40,
  avoidance: 33,
  rupture: 16
};

function inferConversationRecovery(
  a: ShadowProfile,
  b: ShadowProfile,
  scenarios: FrictionScenario[]
): { rating: ConversationRecoveryRating; notes: string } {
  const aDir = directInConflict(a);
  const bDir = directInConflict(b);
  const aAvoid = avoidsConflict(a);
  const bAvoid = avoidsConflict(b);
  const clash = (aAvoid && bDir) || (bAvoid && aDir);
  const bothAvoid = aAvoid && bAvoid;
  const someDirect = aDir || bDir;
  const playful = isPlayful(a) && isPlayful(b);
  const highUnmanageable = scenarios.some((s) => s.severity === "high" && !s.manageable);

  let rating: ConversationRecoveryRating;
  let notes: string;

  if (bothAvoid) {
    rating = highUnmanageable ? "rupture" : "avoidance";
    notes =
      "Both tend to withdraw, so an awkward moment risks being left unsaid rather than repaired.";
  } else if (clash) {
    rating = highUnmanageable ? "unresolved tension" : "forced recovery";
    notes =
      "One confronts while the other withdraws — repair happens, but it costs effort and can feel one-sided.";
  } else if (aDir && bDir) {
    rating = playful ? "playful recovery" : "easy recovery";
    notes = playful
      ? "Both name tension directly and can disarm it with humour, so awkward beats pass quickly."
      : "Both address things head-on, so the conversation rights itself after a wobble.";
  } else if (someDirect) {
    rating = playful ? "playful recovery" : "forced recovery";
    notes = playful
      ? "Only one clearly steers repair, but shared lightness keeps a stumble from sticking."
      : "Only one of them clearly steers repair, so recovery depends on that person carrying it.";
  } else {
    rating = playful ? "playful recovery" : "forced recovery";
    notes =
      "Neither has shown a clear repair style yet — worth watching how they handle the first real friction.";
  }

  return { rating, notes };
}

/** Distinct complementary differences — the intriguing kind, not the clashing kind. */
function complementaryDifferences(a: ShadowProfile, b: ShadowProfile): string[] {
  const out: string[] = [];
  if ((isCalmPresence(a) && isIntense(b)) || (isCalmPresence(b) && isIntense(a))) {
    out.push("one runs calm where the other runs intense");
  }
  if ((isSpontaneous(a) && needsPredictability(b)) || (isSpontaneous(b) && needsPredictability(a))) {
    out.push("one is spontaneous where the other likes a plan");
  }
  if ((movesFast(a) && movesSlow(b)) || (movesFast(b) && movesSlow(a))) {
    out.push("one moves fast where the other moves slowly");
  }
  if ((isAmbitious(a) && wantsCalm(b)) || (isAmbitious(b) && wantsCalm(a))) {
    out.push("one is driven where the other protects calm");
  }
  return uniq(out);
}

/**
 * Build the full resonance report. `user` is the person the report is for, so
 * phrasing can stay oriented to them. The *score* is symmetric, so orientation
 * never changes the number — only the wording.
 */
function computeResonance(
  user: ShadowProfile,
  other: ShadowProfile,
  opts?: { unresolvedQuestions?: string[] }
): ResonanceReport {
  const userName = nameOf(user);
  const otherName = nameOf(other);

  const rawDynamics: ResonanceDynamic[] = [
    ...dynamicsFromSource(other, user, otherName, userName),
    ...dynamicsFromSource(user, other, userName, otherName),
    ...mutualDynamics(user, other, userName, otherName)
  ];

  // De-duplicate identical reactions (some fire from both directions).
  const seen = new Set<string>();
  const dynamics = rawDynamics.filter((d) => {
    const key = `${d.trait}|${d.reaction}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const traitReactions: TraitReaction[] = dynamics.map((d) => ({
    trait: d.trait,
    fromUser: d.sourceName,
    reactionInOther: capitalize(d.reaction),
    positiveOrNegative: d.valence,
    notes: `${capitalize(d.trait)} ${d.reaction}.`
  }));

  // ── trait-reaction valence (0–100) ──
  let valence = 50;
  for (const d of dynamics) {
    valence += d.valence === "positive" ? 11 : d.valence === "negative" ? -13 : 0;
  }
  valence = clamp(valence);

  // ── nervous-system fit ──
  const nsCounts = new Map<NervousSystemEffect, number>();
  let nsScore = 58;
  for (const d of dynamics) {
    for (const e of d.ns) {
      nsCounts.set(e, (nsCounts.get(e) ?? 0) + 1);
      if (POSITIVE_NS.includes(e)) nsScore += 7;
      else if (NEGATIVE_NS.includes(e)) nsScore -= 11;
      else if (e === "activated") nsScore -= 4; // arousal, not necessarily bad
    }
  }
  nsScore = clamp(nsScore);
  const nsEffects = [...nsCounts.entries()]
    .sort((x, y) => y[1] - x[1])
    .map(([e]) => e)
    .slice(0, 4);
  const nsNotes =
    nsScore >= 68
      ? `${otherName} seems to settle ${userName}'s nervous system more than they rattle it.`
      : nsScore >= 48
        ? `${otherName} is a mix of soothing and activating for ${userName} — neither purely safe nor purely stressful.`
        : `${otherName} tends to activate ${userName} more than they regulate them.`;

  // ── conversation recovery ──
  const scenarios = detectFrictionScenarios(user, other);
  const recovery = inferConversationRecovery(user, other, scenarios);
  const recoveryScore = RECOVERY_SCORE[recovery.rating];

  // ── curiosity pull ──
  const complements = complementaryDifferences(user, other);
  const surfaceOverlap =
    sharedThemes(user.values, other.values).length +
    sharedThemes(user.lifestylePreferences, other.lifestylePreferences).length;
  let curiosityScore = 45 + complements.length * 13;
  if (isCurious(user) && isCurious(other)) curiosityScore += 12;
  if (complements.length > 0 && surfaceOverlap <= 1) curiosityScore += 8; // intrigue despite low similarity
  curiosityScore = clamp(curiosityScore);
  const followUpTopics = uniq([
    ...complements.map((c) => `Explore how it feels that ${c}.`),
    ...scenarios.map((s) => s.discussTopic)
  ]).slice(0, 4);
  const unresolvedQuestions = uniq([
    ...(opts?.unresolvedQuestions ?? []),
    ...complements.map(
      (c) => `Is the fact that ${c} something that stays attractive, or starts to grate?`
    )
  ]).slice(0, 4);
  const wantsAnotherMeeting = curiosityScore >= 55;

  // ── post-meeting residue ──
  const positives = dynamics.filter((d) => d.valence === "positive").length;
  const negatives = dynamics.filter((d) => d.valence === "negative").length;
  const effectSet = new Set<EmotionalEffect>(dynamics.flatMap((d) => d.effects));
  const desireToContinueScore = clamp(
    0.4 * nsScore + 0.3 * curiosityScore + 0.3 * recoveryScore
  );

  let primaryFeeling: ResidueFeeling;
  if (negatives > positives && desireToContinueScore < 45) {
    primaryFeeling = desireToContinueScore < 32 ? "relief it ended" : "uncertainty";
  } else if (curiosityScore >= 65 && (effectSet.has("exciting") || effectSet.has("energising"))) {
    primaryFeeling = "excitement";
  } else if (effectSet.has("calming") || effectSet.has("grounding") || effectSet.has("safe")) {
    primaryFeeling = positives >= 2 ? "warmth" : "calm";
  } else if (wantsAnotherMeeting) {
    primaryFeeling = "desire to continue";
  } else {
    primaryFeeling = "curiosity";
  }
  const secondaryFeelings = uniq(
    [
      effectSet.has("safe") ? "feeling at ease" : "",
      effectSet.has("playful") ? "lightness" : "",
      effectSet.has("addictive/intense") ? "a pull that's hard to put down" : "",
      curiosityScore >= 55 ? "lingering curiosity" : "",
      negatives > 0 ? "a question mark worth watching" : ""
    ].filter(Boolean)
  ).slice(0, 3);

  // ── values preview (NOT a score driver — things to explore later) ──
  const sharedValues = sharedThemes(user.values, other.values);
  const likelyAlignment = uniq([
    ...sharedValues.slice(0, 3).map((v) => `Both seem to care about ${lc(v)}.`),
    intentAlignment(user, other) >= 1 ? "They appear to want the same kind of relationship." : ""
  ]).filter(Boolean);
  const likelyFriction = uniq(scenarios.map((s) => s.scenario)).slice(0, 3);
  const needsLaterDiscussion = uniq([
    !user.familyChildrenViews || !other.familyChildrenViews
      ? "Where each of them lands on family/children."
      : "",
    intentRank(user) === null || intentRank(other) === null
      ? "How serious each one actually wants this to be."
      : "",
    ...(other.nonNegotiables ?? []).slice(0, 1).map((n) => `Their non-negotiable: ${lc(n)}.`)
  ]).filter(Boolean);

  // ── top-line emotional effects ──
  const emotionalEffects = uniq([...effectSet]).slice(0, 6) as EmotionalEffect[];

  // ── the main score: driven entirely by emotional effect ──
  const emotionalResonanceScore = clamp(
    valence * 0.25 +
      nsScore * 0.3 +
      recoveryScore * 0.2 +
      curiosityScore * 0.125 +
      desireToContinueScore * 0.125
  );

  const overallResonanceSummary = buildResonanceSummary({
    userName,
    otherName,
    score: emotionalResonanceScore,
    topPositive: dynamics.find((d) => d.valence === "positive") ?? null,
    recoveryRating: recovery.rating,
    curiosityScore,
    surfaceOverlap,
    complements: complements.length,
    primaryFeeling
  });

  return {
    emotionalEffects: emotionalEffects.length ? emotionalEffects : ["confusing"],
    emotionalResonanceScore,
    conversationRecovery: recovery,
    traitReactions,
    curiosityPull: {
      score: curiosityScore,
      unresolvedQuestions,
      followUpTopics,
      wantsAnotherMeeting
    },
    nervousSystemFit: {
      score: nsScore,
      effects: nsEffects.length ? nsEffects : ["activated"],
      notes: nsNotes
    },
    postMeetingResidue: {
      primaryFeeling,
      secondaryFeelings,
      desireToContinueScore
    },
    valuesPreview: {
      likelyAlignment,
      likelyFriction,
      needsLaterDiscussion
    },
    overallResonanceSummary
  };
}

function buildResonanceSummary(args: {
  userName: string;
  otherName: string;
  score: number;
  topPositive: ResonanceDynamic | null;
  recoveryRating: ConversationRecoveryRating;
  curiosityScore: number;
  surfaceOverlap: number;
  complements: number;
  primaryFeeling: ResidueFeeling;
}): string {
  const { userName, otherName, score, topPositive } = args;
  const lead =
    score >= 70
      ? `${otherName} resonates strongly with ${userName}`
      : score >= 52
        ? `${otherName} resonates with ${userName} in a real but uneven way`
        : `${otherName} doesn't yet resonate much with ${userName}`;

  const because = topPositive
    ? ` — not because they like the same things, but because ${topPositive.reaction}`
    : score < 52
      ? " — the surface looks fine, but little actually moves between them"
      : "";

  let tail = "";
  if (args.complements > 0 && args.surfaceOverlap <= 1 && args.curiosityScore >= 60) {
    tail = ` There's high curiosity pull despite low surface similarity.`;
  } else if (args.primaryFeeling === "warmth" || args.primaryFeeling === "calm") {
    tail = ` The strongest signal was the residue afterwards: it left ${userName} ${args.primaryFeeling === "warmth" ? "warm" : "calm"}.`;
  } else if (args.recoveryRating === "rupture" || args.recoveryRating === "avoidance") {
    tail = ` The worry is repair — conversations here don't recover easily.`;
  }

  return `${lead}${because}.${tail}`.replace(/\.\./g, ".");
}

// ─── scoring ─────────────────────────────────────────────────────────────────

function intentAlignment(a: ShadowProfile, b: ShadowProfile): number {
  const ra = intentRank(a);
  const rb = intentRank(b);
  if (ra === null || rb === null) return 0.5;
  const diff = Math.abs(ra - rb);
  return diff === 0 ? 1 : diff === 1 ? 0.6 : 0;
}

/**
 * The overall compatibility score is DRIVEN by emotional resonance — how the two
 * affect each other — not by shared hobbies/interests/lifestyle (those are light
 * context only) and not by values overlap (that moves into `valuesPreview`).
 *
 * Two things remain hard GATES because they are prerequisites, not preferences:
 *   • explicit non-negotiables / a children clash / a serious-vs-casual intent
 *     clash (all surfaced as `nonNegotiableConflicts`), and
 *   • a partial relationship-intent mismatch, which softly caps the score.
 */
function computeCompatibility(
  a: ShadowProfile,
  b: ShadowProfile,
  opts: {
    nonNegotiableConflicts: string[];
    dateFriction?: TravelFriction;
    resonanceScore: number;
  }
): number {
  if (opts.nonNegotiableConflicts.length) {
    return clamp(20 - opts.nonNegotiableConflicts.length * 3, 5, 30);
  }

  // Emotional resonance is the engine of the score.
  let score = opts.resonanceScore;

  // Relationship intent is a prerequisite: a partial mismatch softly caps things
  // (a full clash is already a non-negotiable handled above).
  const i = intentAlignment(a, b);
  if (i < 1) score -= (1 - i) * 10;

  // Logistics is light context only — a small nudge, never a driver.
  if (opts.dateFriction === "high") score -= 4;
  else if (opts.dateFriction === "low") score += 2;

  return clamp(score);
}

function profileCompleteness(p: ShadowProfile): number {
  const checks: boolean[] = [
    p.values.length > 0,
    p.personalityTraits.length > 0,
    !!p.communicationStyle,
    (p.emotionalNeeds?.length ?? 0) > 0,
    (p.ambitionGoals?.length ?? 0) > 0,
    (p.lifestylePreferences?.length ?? 0) > 0,
    !!p.conflictStyle,
    !!p.relationshipIntent,
    !!p.familyChildrenViews
  ];
  return checks.filter(Boolean).length / checks.length;
}

function computeConfidence(
  a: ShadowProfile,
  b: ShadowProfile,
  stagesCompleted: string[]
): number {
  const ca = profileCompleteness(a);
  const cb = profileCompleteness(b);
  // Weight toward the LESS complete profile: completing stages mechanically
  // does not buy confidence if one side's data is thin.
  const completeness = 0.4 * ((ca + cb) / 2) + 0.6 * Math.min(ca, cb);
  const stageFactor = Math.min(1, stagesCompleted.length / MEETING_STAGES.length);
  return clamp(completeness * (0.5 + 0.5 * stageFactor) * 100);
}

function decideRecommendation(
  compatibility: number,
  confidence: number,
  nonNegotiableConflicts: string[]
): RecommendationStatus {
  if (nonNegotiableConflicts.length) return "not_recommended";
  if (compatibility >= 62 && confidence >= 60) return "recommended";
  // Promising on the merits but thin on evidence → gather more, don't reject.
  if (compatibility >= 55) return "needs_follow_up";
  // Not promising enough to chase, and too little signal to even tell.
  if (confidence < 40) return "insufficient_data";
  if (compatibility < 48) return "not_recommended";
  return "needs_follow_up";
}

// ─── Stage 1: candidate pre-screen (cheap) ───────────────────────────────────

export function buildCandidatePreScreen(
  a: ShadowProfile,
  b: ShadowProfile,
  prevMemory?: MeetingMemory
): PreScreenResult {
  const A = nameOf(a);
  const B = nameOf(b);
  const nonNegotiableConflicts = detectNonNegotiableConflicts(a, b);
  const obviousMatches: string[] = [];
  const obviousConflicts: string[] = [...nonNegotiableConflicts];
  const reasons: string[] = [];

  const ia = intentRank(a);
  const ib = intentRank(b);
  if (ia !== null && ib !== null && ia === ib) {
    obviousMatches.push("Both are looking for the same kind of relationship.");
  }

  const sv = sharedThemes(a.values, b.values);
  if (sv.length >= 2) obviousMatches.push(`Shared core values: ${joinNice(sv.slice(0, 3))}.`);

  if (a.age && b.age) {
    const gap = Math.abs(a.age - b.age);
    if (gap > 15) obviousConflicts.push(`Large age gap (${gap} years) may matter.`);
    else obviousMatches.push("Ages are in a compatible range.");
  }

  if (a.homeArea && b.homeArea) {
    reasons.push(`${A} is around ${a.homeArea}; ${B} is around ${b.homeArea}.`);
  }

  const missingInformation = collectMissingInfo(a)
    .map((m) => `${A}: ${m}`)
    .concat(collectMissingInfo(b).map((m) => `${B}: ${m}`));

  const surfaceScore = clamp(
    intentAlignment(a, b) * 45 +
      Math.min(1, sv.length / 3) * 35 +
      (nonNegotiableConflicts.length ? 0 : 20)
  );

  const shouldContinue = nonNegotiableConflicts.length === 0 && surfaceScore >= 30;

  let stageToRunNext: MeetingStage = "values_rhythm";
  if (prevMemory) stageToRunNext = nextStageFromMemory(prevMemory);
  else if (!shouldContinue) stageToRunNext = "handoff";

  if (nonNegotiableConflicts.length) reasons.push("Stopped early on a non-negotiable conflict.");
  else if (shouldContinue) reasons.push("Plausible enough to explore values and emotional rhythm.");
  else reasons.push("Too little surface overlap to justify a deeper meeting.");

  return {
    shouldContinue,
    obviousMatches: uniq(obviousMatches),
    obviousConflicts: uniq(obviousConflicts),
    nonNegotiableConflicts,
    missingInformation: uniq(missingInformation),
    stageToRunNext,
    surfaceScore,
    reasons: uniq(reasons)
  };
}

function collectMissingInfo(p: ShadowProfile): string[] {
  const missing: string[] = [];
  if (!p.relationshipIntent) missing.push("relationship intent unknown");
  if ((p.emotionalNeeds?.length ?? 0) === 0) missing.push("emotional needs unclear");
  if (!p.conflictStyle) missing.push("conflict style unknown");
  if (!p.familyChildrenViews) missing.push("views on family/children unknown");
  if ((p.ambitionGoals?.length ?? 0) === 0) missing.push("ambition/goals unclear");
  return missing;
}

function nextStageFromMemory(prev: MeetingMemory): MeetingStage {
  const done = new Set(prev.stagesCompleted);
  for (const stage of MEETING_STAGES) {
    if (!done.has(stage)) return stage;
  }
  if (prev.unresolvedQuestionsForA.length || prev.unresolvedQuestionsForB.length) {
    return "friction_test";
  }
  return "handoff";
}

// ─── Stage 2: agenda generation ──────────────────────────────────────────────

export function generateMeetingAgenda(
  a: ShadowProfile,
  b: ShadowProfile,
  stage: MeetingStage,
  prevMemory?: MeetingMemory
): MeetingAgenda {
  const A = nameOf(a);
  const B = nameOf(b);
  const privacyWarnings: string[] = [];
  for (const [p, name] of [
    [a, A],
    [b, B]
  ] as const) {
    if ((p.doNotDisclose?.length ?? 0) > 0) {
      privacyWarnings.push(
        `Do not disclose ${name}'s protected details — paraphrase at a high level only.`
      );
    }
  }

  let topics: string[] = [];
  let questionsForA: string[] = [];
  let questionsForB: string[] = [];
  let expectedOutputs: string[] = [];

  switch (stage) {
    case "surface":
      topics = ["Relationship intent", "Location & proximity", "Lifestyle basics", "Non-negotiables"];
      questionsForA = [`Is ${A} looking for something serious or casual right now?`];
      questionsForB = [`Is ${B} looking for something serious or casual right now?`];
      expectedOutputs = ["pass / fail / uncertain", "non-negotiable conflicts", "whether to continue"];
      break;
    case "values_rhythm":
      topics = [
        "Core values",
        "Emotional availability & reassurance",
        "Communication & humour",
        "Independence vs togetherness",
        "Pace of dating"
      ];
      questionsForA = [
        `What does ${A} need to feel emotionally safe early on?`,
        `How does ${A} communicate when something is wrong?`
      ];
      questionsForB = [
        `What does ${B} need to feel emotionally safe early on?`,
        `How does ${B} respond to a partner who needs reassurance?`
      ];
      expectedOutputs = [
        "areas of alignment",
        "areas of friction",
        "emotional rhythm fit",
        "unresolved questions"
      ];
      break;
    case "friction_test":
      topics = ["Likely sources of future tension", "Emotional pace", "Conflict & repair"];
      questionsForA = [`How does ${A} handle quiet stretches or busy periods?`];
      questionsForB = [`How does ${B} handle a partner who is intense or work-focused?`];
      expectedOutputs = [
        "likely friction scenarios",
        "severity",
        "whether manageable",
        "topics to discuss in person"
      ];
      break;
    case "logistics":
      topics = ["Home & work areas", "Travel tolerance", "Preferred first-date format", "Schedule"];
      questionsForA = [`Where is ${A} based, and how far will ${A} travel for a first date?`];
      questionsForB = [`Where is ${B} based, and what first-date format does ${B} prefer?`];
      expectedOutputs = [
        "suggested meeting zone",
        "suggested first-date type",
        "travel friction",
        "backup option"
      ];
      break;
    case "handoff":
      topics = ["Final recommendation"];
      expectedOutputs = [
        "recommended / not recommended / needs follow-up",
        "confidence",
        "first message & date",
        "what the Shadow still needs to know"
      ];
      break;
  }

  let recap: string | undefined;
  if (prevMemory) {
    const established = joinNice(prevMemory.areasOfAlignment.slice(0, 3)) || "the basics";
    const unresolved = uniq([
      ...prevMemory.unresolvedQuestionsForA,
      ...prevMemory.unresolvedQuestionsForB
    ]);
    recap = `Last time we established ${established}. The unresolved questions are: ${
      joinNice(unresolved.slice(0, 4)) || "none recorded"
    }. This meeting focuses only on those.`;
    if (unresolved.length) {
      questionsForA = uniq([...prevMemory.unresolvedQuestionsForA, ...questionsForA]).slice(0, 3);
      questionsForB = uniq([...prevMemory.unresolvedQuestionsForB, ...questionsForB]).slice(0, 3);
      topics = uniq(["Unresolved questions from last meeting", ...topics]);
    }
  }

  return {
    stage,
    topics,
    questionsForA,
    questionsForB,
    privacyWarnings: uniq(privacyWarnings),
    expectedOutputs,
    recap
  };
}

// ─── Stage 3: structured agent exchange for one stage ────────────────────────

export function runStructuredShadowMeeting(
  a: ShadowProfile,
  b: ShadowProfile,
  agenda: MeetingAgenda,
  prevMemory?: MeetingMemory
): StructuredMeetingResult {
  const stage = agenda.stage;
  const A = nameOf(a);
  const B = nameOf(b);
  const labelA = `${A}'s Shadow`;
  const labelB = `${B}'s Shadow`;

  const exchange: ExchangeMessage[] = [];
  const privacyBoundariesHit: string[] = [];
  const factsAboutA: string[] = [];
  const factsAboutB: string[] = [];
  const alignment: string[] = [];
  const friction: string[] = [];
  const unresolvedForA: string[] = [];
  const unresolvedForB: string[] = [];
  let firstDateSuggestion: FirstDateSuggestion | undefined;

  const push = (m: Omit<ExchangeMessage, "stage">) => {
    if (exchange.length >= MAX_TURNS_PER_STAGE) return;
    exchange.push({ stage, ...m });
  };

  if (agenda.recap) {
    push({
      speaker: a.userId,
      speakerLabel: labelA,
      intent: "RESOLUTION",
      content: agenda.recap,
      evidenceType: "profile",
      privacyLevel: "public",
      extractedFacts: []
    });
  }

  const nonNegotiableConflicts = detectNonNegotiableConflicts(a, b);
  const intentText = (r: number | null): string =>
    r === 2
      ? "something serious"
      : r === 0
        ? "something casual"
        : r === 1
          ? "an open-minded relationship"
          : "an unclear intent";

  switch (stage) {
    case "surface": {
      const ia = intentRank(a);
      const ib = intentRank(b);
      push({
        speaker: a.userId,
        speakerLabel: labelA,
        intent: "CLAIM",
        content: `${A} is looking for ${intentText(ia)}.`,
        evidenceType: "profile",
        privacyLevel: "shareable",
        extractedFacts: ia !== null ? [`${A} intent: ${intentText(ia)}`] : []
      });
      push({
        speaker: b.userId,
        speakerLabel: labelB,
        intent: "CLAIM",
        content: `${B} is looking for ${intentText(ib)}.`,
        evidenceType: "profile",
        privacyLevel: "shareable",
        extractedFacts: ib !== null ? [`${B} intent: ${intentText(ib)}`] : []
      });
      if (ia !== null && ib !== null && ia === ib) alignment.push("Aligned on relationship intent.");
      else if (ia !== null && ib !== null && Math.abs(ia - ib) >= 2) {
        friction.push("Mismatched relationship intent.");
      }

      const sv = sharedThemes(a.values, b.values);
      if (sv.length) {
        push({
          speaker: a.userId,
          speakerLabel: labelA,
          intent: "EVIDENCE",
          content: `Both value ${joinNice(sv.slice(0, 3))}.`,
          evidenceType: "profile",
          privacyLevel: "shareable",
          extractedFacts: []
        });
        alignment.push(`Shared values: ${joinNice(sv.slice(0, 3))}.`);
      }

      if (nonNegotiableConflicts.length) {
        push({
          speaker: b.userId,
          speakerLabel: labelB,
          intent: "CONCERN",
          content: `There is a non-negotiable conflict — ${nonNegotiableConflicts[0]}`,
          evidenceType: "profile",
          privacyLevel: "shareable",
          extractedFacts: []
        });
      } else {
        push({
          speaker: b.userId,
          speakerLabel: labelB,
          intent: "RESOLUTION",
          content: "No obvious dealbreakers at the surface — worth a deeper look.",
          evidenceType: "inference",
          privacyLevel: "public",
          extractedFacts: []
        });
      }

      factsAboutA.push(...(a.shareableFacts ?? []).slice(0, 2));
      factsAboutB.push(...(b.shareableFacts ?? []).slice(0, 2));
      break;
    }

    case "values_rhythm": {
      push({
        speaker: a.userId,
        speakerLabel: labelA,
        intent: "CLAIM",
        content: `${A} most values ${joinNice(a.values.slice(0, 3))}.`,
        evidenceType: "profile",
        privacyLevel: "shareable",
        extractedFacts: a.values.length ? [`${A} values: ${joinNice(a.values.slice(0, 3))}`] : []
      });
      push({
        speaker: b.userId,
        speakerLabel: labelB,
        intent: "QUESTION",
        content: `How does ${A} stay emotionally available when life gets demanding?`,
        evidenceType: "inference",
        privacyLevel: "public",
        extractedFacts: []
      });

      const da = discloseEmotionalPattern(a);
      push({
        speaker: a.userId,
        speakerLabel: labelA,
        intent: "EVIDENCE",
        content: da.text,
        evidenceType: "pattern",
        privacyLevel: da.privacyLevel,
        extractedFacts: [da.text]
      });
      if (da.boundaryHit) privacyBoundariesHit.push(da.boundaryHit);
      factsAboutA.push(da.text);

      const db = discloseEmotionalPattern(b);
      push({
        speaker: b.userId,
        speakerLabel: labelB,
        intent: "EVIDENCE",
        content: db.text,
        evidenceType: "pattern",
        privacyLevel: db.privacyLevel,
        extractedFacts: [db.text]
      });
      if (db.boundaryHit) privacyBoundariesHit.push(db.boundaryHit);
      factsAboutB.push(db.text);

      const sv = sharedThemes(a.values, b.values);
      if (sv.length) alignment.push(`Shared values: ${joinNice(sv.slice(0, 3))}.`);
      if (
        a.communicationStyle &&
        b.communicationStyle &&
        sharedThemes([a.communicationStyle], [b.communicationStyle]).length
      ) {
        alignment.push("Compatible communication styles.");
      }

      const frictions = detectFrictionScenarios(a, b);
      if (frictions.length) {
        push({
          speaker: a.userId,
          speakerLabel: labelA,
          intent: "CONCERN",
          content: frictions[0].scenario,
          evidenceType: "inference",
          privacyLevel: "shareable",
          extractedFacts: []
        });
        for (const f of frictions) friction.push(f.scenario);
      } else {
        push({
          speaker: a.userId,
          speakerLabel: labelA,
          intent: "RESOLUTION",
          content: "Emotional rhythms look broadly compatible.",
          evidenceType: "inference",
          privacyLevel: "public",
          extractedFacts: []
        });
      }

      if (!a.conflictStyle) unresolvedForA.push(`How does ${A} handle conflict and repair?`);
      if (!b.conflictStyle) unresolvedForB.push(`How does ${B} handle conflict and repair?`);
      if ((a.emotionalNeeds?.length ?? 0) === 0) {
        unresolvedForA.push(`What does ${A} actually need to feel secure?`);
      }
      if ((b.emotionalNeeds?.length ?? 0) === 0) {
        unresolvedForB.push(`What does ${B} actually need to feel secure?`);
      }
      break;
    }

    case "friction_test": {
      const frictions = detectFrictionScenarios(a, b);
      if (frictions.length === 0) {
        push({
          speaker: a.userId,
          speakerLabel: labelA,
          intent: "RESOLUTION",
          content: "Stress-testing surfaced no major structural friction.",
          evidenceType: "inference",
          privacyLevel: "public",
          extractedFacts: []
        });
        alignment.push("No major structural friction found under stress-testing.");
      } else {
        for (const f of frictions.slice(0, 3)) {
          push({
            speaker: a.userId,
            speakerLabel: labelA,
            intent: "CONCERN",
            content: `${f.scenario} (severity: ${f.severity})`,
            evidenceType: "inference",
            privacyLevel: "shareable",
            extractedFacts: []
          });
          push({
            speaker: b.userId,
            speakerLabel: labelB,
            intent: f.manageable ? "RESOLUTION" : "FOLLOW_UP",
            content: f.manageable
              ? `Manageable — ${f.whatToUnderstand}`
              : `Needs a follow-up — ${f.whatToUnderstand}`,
            evidenceType: "inference",
            privacyLevel: "shareable",
            extractedFacts: []
          });
          friction.push(
            `${f.scenario} — ${f.manageable ? "manageable" : "needs attention"} (${f.severity}).`
          );
          if (!f.manageable) {
            unresolvedForA.push(f.discussTopic);
            unresolvedForB.push(f.discussTopic);
          }
        }
      }
      break;
    }

    case "logistics": {
      const suggestion = buildLogistics(a, b);
      firstDateSuggestion = suggestion;
      push({
        speaker: a.userId,
        speakerLabel: labelA,
        intent: "CLAIM",
        content: `${A} is based around ${a.homeArea ?? a.locationArea ?? "an unspecified area"}${
          a.workArea ? `, working in ${a.workArea}` : ""
        }.`,
        evidenceType: "logistics",
        privacyLevel: "shareable",
        extractedFacts: []
      });
      push({
        speaker: b.userId,
        speakerLabel: labelB,
        intent: "CLAIM",
        content: `${B} is based around ${b.homeArea ?? b.locationArea ?? "an unspecified area"}${
          b.workArea ? `, working in ${b.workArea}` : ""
        }.`,
        evidenceType: "logistics",
        privacyLevel: "shareable",
        extractedFacts: []
      });
      push({
        speaker: a.userId,
        speakerLabel: labelA,
        intent: "RESOLUTION",
        content: `${suggestion.meetingZone ?? "A central spot"} works well — ${
          suggestion.reasoning ?? "convenient for both"
        }`,
        evidenceType: "logistics",
        privacyLevel: "public",
        extractedFacts: []
      });
      alignment.push(
        `Convenient meeting zone: ${suggestion.meetingZone ?? "central"} (${
          suggestion.travelFriction ?? "unknown"
        } travel friction).`
      );
      break;
    }

    case "handoff": {
      push({
        speaker: a.userId,
        speakerLabel: labelA,
        intent: "RESOLUTION",
        content: "Synthesising everything into a recommendation for the humans.",
        evidenceType: "inference",
        privacyLevel: "public",
        extractedFacts: []
      });
      break;
    }
  }

  const stageConfidence = clamp(((profileCompleteness(a) + profileCompleteness(b)) / 2) * 100);

  return {
    stage,
    exchange,
    alignment: uniq(alignment),
    friction: uniq(friction),
    factsAboutA: uniq(factsAboutA),
    factsAboutB: uniq(factsAboutB),
    unresolvedForA: uniq(unresolvedForA),
    unresolvedForB: uniq(unresolvedForB),
    nonNegotiableConflicts: stage === "surface" ? nonNegotiableConflicts : [],
    privacyBoundariesHit: uniq(privacyBoundariesHit),
    stageConfidence,
    firstDateSuggestion
  };
}

// ─── logistics helper (reuses the existing smart-date engine) ────────────────

function buildLogistics(a: ShadowProfile, b: ShadowProfile): FirstDateSuggestion {
  const aLoc: PersonLocation = {
    home: a.homeArea ?? a.locationArea ?? "",
    work: a.workArea ?? ""
  };
  const bLoc: PersonLocation = {
    home: b.homeArea ?? b.locationArea ?? "",
    work: b.workArea ?? ""
  };
  const haveData = (aLoc.home || aLoc.work) && (bLoc.home || bLoc.work);
  if (!haveData) {
    return {
      meetingZone: "Somewhere central",
      dateType: "drinks",
      reasoning: "Not enough location detail yet — pick somewhere central and easy.",
      travelFriction: "unknown",
      backup: "A weekend brunch midway between you."
    };
  }
  const s = computeSmartDate(aLoc, bLoc);
  return {
    meetingZone: s.meetZone,
    dateType: s.venue.type,
    reasoning: s.reasoning,
    travelFriction: deriveTravelFriction(s.distanceFromYou, s.distanceFromThem),
    backup: s.commuteNote || "A weekend daytime option if weekday evenings are hard."
  };
}

function deriveTravelFriction(fromYou: string, fromThem: string): TravelFriction {
  const da = Number.parseFloat(fromYou);
  const db = Number.parseFloat(fromThem);
  if (!Number.isFinite(da) || !Number.isFinite(db)) return "unknown";
  const worst = Math.max(da, db);
  if (worst <= 2.5) return "low";
  if (worst <= 5) return "medium";
  return "high";
}

// ─── Stage 4: synthesis into MeetingMemory ───────────────────────────────────

export function synthesizeMeetingMemory(
  a: ShadowProfile,
  b: ShadowProfile,
  stageResults: StructuredMeetingResult[],
  prevMemory?: MeetingMemory,
  opts?: {
    meetingId?: string;
    now?: Date;
    /**
     * 0–100 emotional-resonance read derived from what the two agents ACTUALLY
     * said in a live, turn-by-turn meeting. When present it is blended with the
     * deterministic (profile-based) resonance so the real exchange drives the
     * verdict, while the deterministic score remains a grounding guardrail.
     */
    liveResonanceScore?: number;
    /** How much weight (0–1) to give the live read. Defaults to 0.5. */
    liveResonanceWeight?: number;
  }
): MeetingMemory {
  const now = (opts?.now ?? new Date()).toISOString();
  const id = opts?.meetingId ?? `mtg_${pairId(a.userId, b.userId)}_${Date.parse(now) || Date.now()}`;

  const stagesCompleted = uniq([
    ...(prevMemory?.stagesCompleted ?? []),
    ...stageResults.map((s) => s.stage)
  ]);
  const topicsCovered = uniq([
    ...(prevMemory?.topicsCovered ?? []),
    ...stageResults.map((s) => STAGE_LABELS[s.stage])
  ]);
  const factsLearnedAboutA = uniq([
    ...(prevMemory?.factsLearnedAboutA ?? []),
    ...stageResults.flatMap((s) => s.factsAboutA)
  ]);
  const factsLearnedAboutB = uniq([
    ...(prevMemory?.factsLearnedAboutB ?? []),
    ...stageResults.flatMap((s) => s.factsAboutB)
  ]);
  const areasOfAlignment = uniq([
    ...(prevMemory?.areasOfAlignment ?? []),
    ...stageResults.flatMap((s) => s.alignment)
  ]);
  const areasOfFriction = uniq([
    ...(prevMemory?.areasOfFriction ?? []),
    ...stageResults.flatMap((s) => s.friction)
  ]);
  const nonNegotiableConflicts = uniq([
    ...(prevMemory?.nonNegotiableConflicts ?? []),
    ...stageResults.flatMap((s) => s.nonNegotiableConflicts)
  ]);
  const privacyBoundariesHit = uniq([
    ...(prevMemory?.privacyBoundariesHit ?? []),
    ...stageResults.flatMap((s) => s.privacyBoundariesHit)
  ]);

  const newUnresolvedA = uniq(stageResults.flatMap((s) => s.unresolvedForA));
  const newUnresolvedB = uniq(stageResults.flatMap((s) => s.unresolvedForB));

  // For follow-ups: a previously-unresolved question is considered resolved
  // unless it was raised again in this meeting. Anything raised this meeting
  // (old or new) stays on the list.
  let unresolvedQuestionsForA = newUnresolvedA;
  let unresolvedQuestionsForB = newUnresolvedB;
  if (prevMemory) {
    const stillA = prevMemory.unresolvedQuestionsForA.filter((q) => newUnresolvedA.includes(q));
    const stillB = prevMemory.unresolvedQuestionsForB.filter((q) => newUnresolvedB.includes(q));
    unresolvedQuestionsForA = uniq([...stillA, ...newUnresolvedA]);
    unresolvedQuestionsForB = uniq([...stillB, ...newUnresolvedB]);
  }

  const firstDateSuggestion =
    stageResults.find((s) => s.firstDateSuggestion)?.firstDateSuggestion ??
    prevMemory?.firstDateSuggestion;

  // Emotional resonance is computed first and DRIVES the compatibility score.
  // The deterministic read (profile-based) is the grounding/guardrail. If a live
  // turn-by-turn meeting produced its own read of how the two actually affected
  // each other, blend it in so the real exchange — not just the static profiles
  // — moves the final number.
  const resonance = computeResonance(a, b, {
    unresolvedQuestions: uniq([...unresolvedQuestionsForA, ...unresolvedQuestionsForB])
  });
  const groundedResonanceScore = resonance.emotionalResonanceScore;
  const liveWeight =
    typeof opts?.liveResonanceScore === "number"
      ? Math.max(0, Math.min(1, opts.liveResonanceWeight ?? 0.5))
      : 0;
  const resonanceScore = clamp(
    groundedResonanceScore * (1 - liveWeight) +
      clamp(opts?.liveResonanceScore ?? groundedResonanceScore) * liveWeight
  );
  const compatibilityScore = computeCompatibility(a, b, {
    nonNegotiableConflicts,
    dateFriction: firstDateSuggestion?.travelFriction,
    resonanceScore
  });
  const confidenceScore = computeConfidence(a, b, stagesCompleted);
  const recommendationStatus = decideRecommendation(
    compatibilityScore,
    confidenceScore,
    nonNegotiableConflicts
  );

  const nextMeetingAgenda = buildNextAgenda({
    unresolvedForA: unresolvedQuestionsForA,
    unresolvedForB: unresolvedQuestionsForB,
    friction: areasOfFriction,
    confidenceScore,
    stagesCompleted
  });

  return {
    meetingId: id,
    pairId: pairId(a.userId, b.userId),
    userAId: a.userId,
    userBId: b.userId,
    stagesCompleted,
    topicsCovered,
    factsLearnedAboutA,
    factsLearnedAboutB,
    areasOfAlignment,
    areasOfFriction,
    unresolvedQuestionsForA,
    unresolvedQuestionsForB,
    nonNegotiableConflicts,
    privacyBoundariesHit,
    compatibilityScore,
    confidenceScore,
    nextMeetingAgenda,
    recommendationStatus,
    firstDateSuggestion,
    meetingNumber: (prevMemory?.meetingNumber ?? 0) + 1,
    createdAt: prevMemory?.createdAt ?? now,
    updatedAt: now
  };
}

function buildNextAgenda(args: {
  unresolvedForA: string[];
  unresolvedForB: string[];
  friction: string[];
  confidenceScore: number;
  stagesCompleted: string[];
}): string[] {
  const agenda: string[] = [...args.unresolvedForA, ...args.unresolvedForB];
  if (args.confidenceScore < 55) {
    agenda.push("Gather more profile depth before fully recommending.");
  }
  for (const f of args.friction) {
    if (/needs attention|\(high\)/.test(f)) agenda.push(`Re-test the friction point — ${f}`);
  }
  const remaining = MEETING_STAGES.filter(
    (s) => !args.stagesCompleted.includes(s) && s !== "handoff"
  );
  for (const s of remaining) agenda.push(`Run a stage not yet covered — ${STAGE_LABELS[s]}.`);
  return uniq(agenda).slice(0, 6);
}

export function getNextMeetingAgenda(memory: MeetingMemory): string[] {
  return memory.nextMeetingAgenda;
}

// ─── Stage 5: human-facing report ────────────────────────────────────────────

export function generateHumanMatchReport(
  memory: MeetingMemory,
  forUser: ShadowProfile,
  candidate: ShadowProfile
): ShadowMatchReport {
  const B = nameOf(candidate);
  const status = memory.recommendationStatus;

  // The same resonance the score is built on, attached for the human + iOS.
  const resonance = computeResonance(forUser, candidate, {
    unresolvedQuestions: uniq([
      ...memory.unresolvedQuestionsForB,
      ...memory.unresolvedQuestionsForA
    ])
  });

  // "Why" is now led by emotional resonance, not by overlapping interests.
  const why = uniq([
    ...buildResonanceReasons(resonance, memory),
    ...(candidate.greenFlags ?? []).slice(0, 1)
  ]);

  const questionsToAskInPerson = uniq([
    ...resonance.curiosityPull.unresolvedQuestions,
    ...memory.unresolvedQuestionsForB,
    ...detectFrictionScenarios(forUser, candidate).map((f) => f.discussTopic)
  ]).slice(0, 3);

  return {
    headline: buildHeadline(status, resonance, B),
    summary: buildSummary(memory, resonance),
    recommendationStatus: status,
    compatibilityScore: memory.compatibilityScore,
    confidenceScore: memory.confidenceScore,
    whyYourShadowPickedThem: why.length
      ? why
      : ["Worth a closer look on how you two affect each other."],
    areasOfAlignment: memory.areasOfAlignment,
    potentialFriction: memory.areasOfFriction,
    greenFlags: uniq(candidate.greenFlags ?? []),
    redFlags: uniq(candidate.redFlags ?? []),
    questionsToAskInPerson: questionsToAskInPerson.length
      ? questionsToAskInPerson
      : ["What does a genuinely good week look like for you?"],
    whatNotToOverdo: buildWhatNotToOverdo(forUser, candidate),
    suggestedFirstMessage: buildFirstMessage(memory, candidate),
    suggestedFirstDate: buildFirstDateLine(memory.firstDateSuggestion),
    locationConvenience: memory.firstDateSuggestion?.reasoning,
    whatYourShadowStillNeedsToKnow: uniq([
      ...resonance.valuesPreview.needsLaterDiscussion,
      ...memory.unresolvedQuestionsForA,
      ...(memory.confidenceScore < 55
        ? ["More detail about emotional needs and conflict style would sharpen this read."]
        : [])
    ]),
    resonanceReport: resonance
  };
}

/** Resonance-led reasons, phrased around emotional effect rather than overlap. */
function buildResonanceReasons(
  resonance: ResonanceReport,
  memory: MeetingMemory
): string[] {
  const reasons: string[] = [];
  const topPositive = resonance.traitReactions.find(
    (t) => t.positiveOrNegative === "positive"
  );
  if (topPositive) {
    reasons.push(`Not because you like the same things — because ${lc(topPositive.reactionInOther)}.`);
  }
  if (resonance.nervousSystemFit.score >= 65) {
    reasons.push(resonance.nervousSystemFit.notes);
  }
  if (
    resonance.curiosityPull.score >= 60 &&
    resonance.valuesPreview.likelyAlignment.length <= 1
  ) {
    reasons.push("High curiosity pull despite low surface similarity.");
  }
  if (
    resonance.postMeetingResidue.primaryFeeling === "warmth" ||
    resonance.postMeetingResidue.primaryFeeling === "calm" ||
    resonance.postMeetingResidue.primaryFeeling === "desire to continue"
  ) {
    reasons.push(
      `The strongest signal was the residue afterwards — it left a sense of ${resonance.postMeetingResidue.primaryFeeling}.`
    );
  }
  if (reasons.length === 0) {
    reasons.push(...memory.areasOfAlignment.slice(0, 2));
  }
  return reasons.slice(0, 3);
}

function buildHeadline(
  status: RecommendationStatus,
  resonance: ResonanceReport,
  name: string
): string {
  const strongResonance = resonance.emotionalResonanceScore >= 70;
  switch (status) {
    case "recommended":
      return strongResonance
        ? `${name} resonates — worth meeting.`
        : `Worth meeting ${name}.`;
    case "needs_follow_up":
      return resonance.curiosityPull.wantsAnotherMeeting
        ? `${name} left real curiosity — your Shadow wants one more conversation.`
        : `${name} is a maybe — a few things to feel out first.`;
    case "not_recommended":
      return `Your Shadow doesn't recommend ${name}.`;
    case "insufficient_data":
      return `Too early to call on ${name}.`;
  }
}

function buildSummary(memory: MeetingMemory, resonance: ResonanceReport): string {
  if (memory.nonNegotiableConflicts.length) {
    return `A non-negotiable conflict stops this one — ${memory.nonNegotiableConflicts[0]}`;
  }
  const conf = memory.confidenceScore;
  // Promising on emotional resonance but thin on evidence: gather more, don't
  // reject. This takes precedence over a generic low-signal message.
  if (resonance.emotionalResonanceScore >= 62 && conf < 55) {
    return `${resonance.overallResonanceSummary} Your Shadow needs more information before fully recommending.`;
  }
  if (conf < 35) {
    return "Not enough signal yet — your Shadow needs another meeting to judge how you two actually affect each other.";
  }
  return resonance.overallResonanceSummary;
}

function buildWhatNotToOverdo(a: ShadowProfile, b: ShadowProfile): string[] {
  const out: string[] = [];
  if (movesFast(a) && (movesSlow(b) || needsPredictability(b))) {
    out.push("Don't move too fast early — let the pace stay comfortable.");
  }
  if (isAmbitious(a) && needsReassurance(b)) {
    out.push("Don't disappear into work without checking in.");
  }
  if (needsReassurance(a) && needsIndependence(b)) {
    out.push("Don't read a need for space as rejection.");
  }
  if (out.length === 0) {
    out.push("Don't over-plan — leave room to actually get to know each other.");
  }
  return uniq(out);
}

function buildFirstMessage(memory: MeetingMemory, candidate: ShadowProfile): string {
  const B = nameOf(candidate);
  if (memory.firstDateSuggestion?.meetingZone && memory.firstDateSuggestion.travelFriction !== "unknown") {
    return `Hi ${B} — our Shadows compared notes and apparently we'd both find ${memory.firstDateSuggestion.meetingZone} easy. Fancy testing whether they were right?`;
  }
  return `Hi ${B} — our Shadows met and came back oddly optimistic. Want to find out if they were onto something?`;
}

function buildFirstDateLine(s?: FirstDateSuggestion): string | undefined {
  if (!s) return undefined;
  const lead = s.dateType ? capitalize(s.dateType) : "Something low-key";
  const zone = s.meetingZone ? ` in ${s.meetingZone}` : "";
  return `${lead}${zone}${s.reasoning ? ` — ${s.reasoning}` : "."}`;
}

// ─── Orchestrator: run a full (or partial) meeting between two Shadows ───────

export interface ShadowMeetingRun {
  preScreen: PreScreenResult;
  stageResults: StructuredMeetingResult[];
  memory: MeetingMemory;
  report: ShadowMatchReport;
}

export function runShadowMeeting(
  a: ShadowProfile,
  b: ShadowProfile,
  options?: {
    stages?: MeetingStage[];
    prevMemory?: MeetingMemory;
    meetingId?: string;
    now?: Date;
  }
): ShadowMeetingRun {
  const prevMemory = options?.prevMemory;
  const preScreen = buildCandidatePreScreen(a, b, prevMemory);

  let stages = options?.stages;
  if (!stages) {
    if (!preScreen.shouldContinue) {
      stages = ["surface", "handoff"];
    } else if (prevMemory) {
      stages = [preScreen.stageToRunNext];
    } else {
      stages = ["surface", "values_rhythm", "friction_test", "logistics", "handoff"];
    }
  }

  const stageResults: StructuredMeetingResult[] = [];
  for (const stage of stages) {
    const agenda = generateMeetingAgenda(a, b, stage, prevMemory);
    stageResults.push(runStructuredShadowMeeting(a, b, agenda, prevMemory));
  }

  const memory = synthesizeMeetingMemory(a, b, stageResults, prevMemory, {
    meetingId: options?.meetingId,
    now: options?.now
  });
  const report = generateHumanMatchReport(memory, a, b);
  memory.humanReport = report;

  return { preScreen, stageResults, memory, report };
}

// ─── Live meeting: build the verdict from a real turn-by-turn exchange ───────
//
// The LLM turn loop (see ./live) produces the actual dialogue plus an extracted
// read of what was said. This orchestrator turns that into the same
// StructuredMeetingResult[] the deterministic engine produces, then reuses the
// SAME synthesis + report code — so scoring, memory and the human report stay
// owned here. Non-negotiable conflicts remain a deterministic guardrail, and
// the live resonance read is blended into the score (see synthesizeMeetingMemory).

export interface LiveStageInput {
  stage: MeetingStage;
  exchange: ExchangeMessage[];
  alignment: string[];
  friction: string[];
  factsAboutA: string[];
  factsAboutB: string[];
  unresolvedForA: string[];
  unresolvedForB: string[];
  privacyBoundariesHit?: string[];
  firstDateSuggestion?: FirstDateSuggestion;
}

export function runShadowMeetingFromLive(
  a: ShadowProfile,
  b: ShadowProfile,
  liveStages: LiveStageInput[],
  opts?: {
    prevMemory?: MeetingMemory;
    meetingId?: string;
    now?: Date;
    liveResonanceScore?: number;
    liveResonanceWeight?: number;
  }
): ShadowMeetingRun {
  const prevMemory = opts?.prevMemory;
  const preScreen = buildCandidatePreScreen(a, b, prevMemory);
  const nonNeg = detectNonNegotiableConflicts(a, b);
  const stageConfidence = clamp(((profileCompleteness(a) + profileCompleteness(b)) / 2) * 100);

  const stageResults: StructuredMeetingResult[] = liveStages.map((s) => ({
    stage: s.stage,
    exchange: s.exchange,
    alignment: uniq(s.alignment),
    friction: uniq(s.friction),
    factsAboutA: uniq(s.factsAboutA),
    factsAboutB: uniq(s.factsAboutB),
    unresolvedForA: uniq(s.unresolvedForA),
    unresolvedForB: uniq(s.unresolvedForB),
    // Hard incompatibilities stay a deterministic guardrail, surfaced on the
    // surface stage exactly as the deterministic engine does.
    nonNegotiableConflicts: s.stage === "surface" ? nonNeg : [],
    privacyBoundariesHit: uniq(s.privacyBoundariesHit ?? []),
    stageConfidence,
    // Logistics is light context only; if the live read didn't carry a date
    // idea, fall back to the deterministic smart-date suggestion.
    firstDateSuggestion:
      s.firstDateSuggestion ?? (s.stage === "logistics" ? buildLogistics(a, b) : undefined)
  }));

  // Guarantee the non-negotiable guardrail is represented even if the live run
  // never produced a surface stage.
  if (nonNeg.length && !stageResults.some((s) => s.nonNegotiableConflicts.length) && stageResults[0]) {
    stageResults[0].nonNegotiableConflicts = nonNeg;
  }

  const memory = synthesizeMeetingMemory(a, b, stageResults, prevMemory, {
    meetingId: opts?.meetingId,
    now: opts?.now,
    liveResonanceScore: opts?.liveResonanceScore,
    liveResonanceWeight: opts?.liveResonanceWeight
  });
  const report = generateHumanMatchReport(memory, a, b);
  memory.humanReport = report;

  return { preScreen, stageResults, memory, report };
}

// ─── The Field: an overnight run with staged cost control ────────────────────

export function runFieldNight(
  user: ShadowProfile,
  candidates: ShadowProfile[],
  options?: FieldNightOptions
): FieldNightResult {
  const now = options?.now ?? new Date();
  const shortlistThreshold = options?.shortlistThreshold ?? 45;
  const deepDiveThreshold = options?.deepDiveThreshold ?? 58;
  const priorMemories = options?.priorMemories ?? {};

  const results: FieldCandidateResult[] = [];

  for (const candidate of candidates) {
    const pid = pairId(user.userId, candidate.userId);
    const prevMemory = priorMemories[pid];
    const preScreen = buildCandidatePreScreen(user, candidate, prevMemory);

    // Stage gating = cost control. Most candidates only get a cheap pre-screen.
    let stages: MeetingStage[];
    if (!preScreen.shouldContinue || preScreen.surfaceScore < shortlistThreshold) {
      stages = ["surface", "handoff"];
    } else if (prevMemory) {
      stages = [preScreen.stageToRunNext];
    } else {
      stages = ["surface", "values_rhythm", "friction_test"];
    }

    let run = runShadowMeeting(user, candidate, { stages, prevMemory, now });

    // Deep dive (logistics + handoff) only for the most promising shortlist.
    if (
      preScreen.shouldContinue &&
      run.memory.compatibilityScore >= deepDiveThreshold &&
      !run.memory.stagesCompleted.includes("logistics")
    ) {
      run = runShadowMeeting(user, candidate, {
        stages: ["logistics", "handoff"],
        prevMemory: run.memory,
        now
      });
    }

    results.push({
      pairId: pid,
      candidate,
      memory: run.memory,
      report: run.report,
      compatibilityScore: run.memory.compatibilityScore,
      confidenceScore: run.memory.confidenceScore,
      recommendationStatus: run.memory.recommendationStatus
    });
  }

  const ranked = rankFieldResults(results);
  const summary = buildMorningSummary(ranked);

  return {
    userId: user.userId,
    metCount: candidates.length,
    ...ranked,
    summary,
    generatedAt: now.toISOString()
  };
}

export function rankFieldResults(results: FieldCandidateResult[]): {
  results: FieldCandidateResult[];
  worthAttention: FieldCandidateResult[];
  followUps: FieldCandidateResult[];
  rejected: FieldCandidateResult[];
} {
  const rank = (r: FieldCandidateResult) =>
    r.compatibilityScore * (0.5 + r.confidenceScore / 200);
  const sorted = [...results].sort((x, y) => rank(y) - rank(x));
  return {
    results: sorted,
    worthAttention: sorted.filter((r) => r.recommendationStatus === "recommended"),
    followUps: sorted.filter((r) => r.recommendationStatus === "needs_follow_up"),
    rejected: sorted.filter(
      (r) =>
        r.recommendationStatus === "not_recommended" ||
        r.recommendationStatus === "insufficient_data"
    )
  };
}

function buildMorningSummary(ranked: {
  results: FieldCandidateResult[];
  worthAttention: FieldCandidateResult[];
  followUps: FieldCandidateResult[];
  rejected: FieldCandidateResult[];
}): string {
  const met = ranked.results.length;
  const worth = ranked.worthAttention.length;
  const follow = ranked.followUps.length;
  const nonNeg = ranked.rejected.filter((r) => r.memory.nonNegotiableConflicts.length).length;

  const lines = [`Your Shadow met ${met} ${met === 1 ? "Shadow" : "Shadows"} overnight.`];
  lines.push(`${worth} ${worth === 1 ? "is" : "are"} worth your attention.`);
  if (follow) lines.push(`${follow} requested a follow-up.`);
  if (nonNeg) lines.push(`${nonNeg} ${nonNeg === 1 ? "was" : "were"} rejected on non-negotiables.`);
  return lines.join("\n");
}
