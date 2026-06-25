// Tests for the Shadow-to-Shadow conversation engine.
//
// Run with Node 22's native TypeScript support:
//   node --experimental-strip-types --test lib/field/field-engine.test.ts
// (see the "test:field" script in package.json)

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildCandidatePreScreen,
  generateMeetingAgenda,
  getNextMeetingAgenda,
  rankFieldResults,
  runFieldNight,
  runShadowMeeting,
  runStructuredShadowMeeting
} from "./engine.ts";
import type { ShadowProfile } from "./types.ts";

// ─── Mock profiles ───────────────────────────────────────────────────────────

const USER: ShadowProfile = {
  userId: "u_hewie",
  displayName: "Hewie",
  age: 31,
  homeArea: "Bow",
  workArea: "Shoreditch",
  relationshipIntent: "Looking for something serious and long-term",
  values: ["Depth", "Agency", "Craft", "Directness", "Emotional steadiness"],
  personalityTraits: ["Intense", "High initiative", "Falls hard fast", "Curious"],
  communicationStyle: "Direct and fast-moving once trust is established",
  humourStyle: "Dry, quick, observational",
  ambitionGoals: ["Build meaningful work", "Found a company"],
  lifestylePreferences: ["Spontaneous weekends", "Always busy", "Late nights"],
  emotionalNeeds: ["Emotional consistency", "Honesty early"],
  conflictStyle: "Direct — wants to talk it out head-on",
  familyChildrenViews: "Wants a family someday",
  greenFlags: ["Loyal under pressure", "Transparent when engaged"],
  redFlags: ["Can become consumed by projects"],
  nonNegotiables: ["Must want children eventually"],
  datingPatterns: ["Moves fast and intensely early"],
  lookingFor: ["Someone emotionally consistent"],
  frustrations: ["Partners who go cold without explanation"],
  shareableFacts: ["Driven founder who wants tenderness without losing momentum"],
  doNotDisclose: []
};

// Strong, fully-specified match.
const MAYA: ShadowProfile = {
  userId: "u_maya",
  displayName: "Maya",
  age: 29,
  homeArea: "Islington",
  workArea: "Farringdon",
  relationshipIntent: "Wants something serious",
  values: ["Depth", "Honesty", "Craft", "Loyalty", "Steadiness"],
  personalityTraits: ["Warm", "Direct", "Curious", "Grounded"],
  communicationStyle: "Direct and warm — says what she means",
  humourStyle: "Dry and observational",
  ambitionGoals: ["Lead a design studio"],
  lifestylePreferences: ["Late nights", "Spontaneous trips"],
  emotionalNeeds: ["Honesty early", "Emotional consistency"],
  conflictStyle: "Direct — addresses things openly",
  familyChildrenViews: "Wants children someday",
  greenFlags: ["Repairs calmly after conflict", "Secure and self-aware"],
  redFlags: [],
  nonNegotiables: ["Wants children"],
  datingPatterns: ["Open and intentional"],
  lookingFor: ["A serious partner with ambition"],
  shareableFacts: ["Grounded, warm, and direct designer"],
  doNotDisclose: []
};

// High surface overlap but almost no depth → should be low confidence.
const SAM: ShadowProfile = {
  userId: "u_sam",
  displayName: "Sam",
  homeArea: "Hackney",
  relationshipIntent: "Looking for something serious",
  values: ["Depth", "Craft", "Directness", "Steadiness"],
  personalityTraits: ["Curious"],
  greenFlags: ["Thoughtful"],
  shareableFacts: ["Quietly creative"],
  doNotDisclose: []
};

// High SURFACE overlap (same hobbies + many shared values) but emotionally
// clashing: avoids conflict where USER is direct, no regulating effect.
const HOBBY_TWIN: ShadowProfile = {
  userId: "u_twin",
  displayName: "Dani",
  age: 30,
  homeArea: "Bow",
  workArea: "Shoreditch",
  relationshipIntent: "Wants something serious",
  values: ["Depth", "Craft", "Directness", "Adventure"],
  personalityTraits: ["Restless", "Avoidant"],
  communicationStyle: "Goes quiet under pressure",
  lifestylePreferences: ["Spontaneous weekends", "Always busy", "Late nights"],
  emotionalNeeds: [],
  conflictStyle: "Avoids conflict and shuts down before circling back",
  familyChildrenViews: "Wants a family someday",
  greenFlags: ["Fun to be around"],
  nonNegotiables: [],
  doNotDisclose: []
};

// Almost NO surface overlap (different hobbies + different values) but
// emotionally regulating: calm, warm, secure, direct in repair.
const RESONANT_STRANGER: ShadowProfile = {
  userId: "u_res",
  displayName: "Noor",
  age: 32,
  homeArea: "Bow",
  workArea: "Shoreditch",
  relationshipIntent: "Wants something serious",
  values: ["Faith", "Family", "Community"],
  personalityTraits: ["Grounded", "Warm", "Secure", "Patient"],
  communicationStyle: "Calm and steady",
  lifestylePreferences: ["Quiet weekends", "Slow mornings", "Early nights"],
  emotionalNeeds: ["Emotional consistency"],
  conflictStyle: "Direct — addresses things calmly",
  familyChildrenViews: "Wants a family someday",
  greenFlags: ["Reliable", "Self-aware"],
  nonNegotiables: [],
  doNotDisclose: []
};

// Hard non-negotiable conflict (children).
const PRIYA: ShadowProfile = {
  userId: "u_priya",
  displayName: "Priya",
  age: 28,
  homeArea: "Brixton",
  workArea: "Victoria",
  relationshipIntent: "Wants something serious",
  values: ["Depth", "Directness", "Adventure"],
  personalityTraits: ["Direct", "Independent"],
  communicationStyle: "Direct",
  conflictStyle: "Direct — talks it out",
  familyChildrenViews: "Child-free by choice, never wants children",
  emotionalNeeds: ["Independence", "Space"],
  greenFlags: ["Knows what she wants"],
  nonNegotiables: ["Child-free"],
  doNotDisclose: []
};

// Sensitive history that must never be disclosed verbatim.
const PRIVATE_PERSON: ShadowProfile = {
  userId: "u_priv",
  displayName: "Alex",
  relationshipIntent: "Wants something serious",
  values: ["Depth", "Craft", "Directness"],
  personalityTraits: ["Curious", "Warm"],
  communicationStyle: "Direct",
  conflictStyle: "Direct",
  emotionalNeeds: ["emotional consistency", "sensitivity to sudden withdrawal"],
  sourceNotes: [
    "Hard breakup with an ex named Linda left them anxious; used ketamine to cope afterwards."
  ],
  doNotDisclose: ["Linda", "ketamine"]
};

// ─── 1. Strong match, high confidence ────────────────────────────────────────

test("strong match yields a confident recommendation", () => {
  const { memory, report, preScreen } = runShadowMeeting(USER, MAYA);

  assert.equal(preScreen.shouldContinue, true);
  assert.equal(memory.recommendationStatus, "recommended");
  assert.ok(memory.compatibilityScore >= 62, `compat ${memory.compatibilityScore}`);
  assert.ok(memory.confidenceScore >= 60, `confidence ${memory.confidenceScore}`);
  assert.equal(report.recommendationStatus, "recommended");
  assert.ok(report.areasOfAlignment.length > 0);
  // All five stages ran in a full meeting.
  assert.equal(memory.stagesCompleted.length, 5);

  // The resonance report is attached and is the real basis of the score.
  const resonance = report.resonanceReport;
  assert.ok(resonance, "expected a resonanceReport on the human report");
  assert.ok(
    resonance.emotionalResonanceScore >= 62,
    `resonance ${resonance.emotionalResonanceScore}`
  );
  // Compatibility is DRIVEN by emotional resonance (gates aside), so the two
  // track each other closely rather than the score coming from overlap.
  assert.ok(
    Math.abs(memory.compatibilityScore - resonance.emotionalResonanceScore) <= 6,
    `compat ${memory.compatibilityScore} vs resonance ${resonance.emotionalResonanceScore}`
  );
  // Resonance is built from how they affect each other, not shared hobbies.
  assert.ok(resonance.traitReactions.length > 0);
  assert.ok(
    resonance.traitReactions.some((t) => t.positiveOrNegative === "positive"),
    "expected at least one positive trait reaction"
  );
  assert.ok(resonance.nervousSystemFit.score >= 0 && resonance.nervousSystemFit.score <= 100);
  assert.ok(resonance.conversationRecovery.rating.length > 0);
});

// ─── 2. Promising match, low confidence ──────────────────────────────────────

test("promising-but-thin match is flagged for follow-up, not recommended", () => {
  // Simulate an early read: only the cheap + medium stages have run.
  const { memory, report } = runShadowMeeting(USER, SAM, {
    stages: ["surface", "values_rhythm"]
  });

  assert.ok(memory.compatibilityScore >= 60, `compat ${memory.compatibilityScore}`);
  assert.ok(memory.confidenceScore < 60, `confidence ${memory.confidenceScore}`);
  assert.equal(memory.recommendationStatus, "needs_follow_up");
  assert.match(report.summary, /needs more information/i);
});

// ─── 2b. Emotional resonance — not surface overlap — drives the score ────────

test("emotional resonance, not shared hobbies/values, drives the score", () => {
  const twin = runShadowMeeting(USER, HOBBY_TWIN);
  const stranger = runShadowMeeting(USER, RESONANT_STRANGER);

  // Sanity-check the premise: the "twin" really does share far more surface
  // overlap (hobbies + values) with USER than the "stranger" does.
  const overlap = (a: string[] | undefined, b: string[] | undefined): number => {
    const bl = new Set((b ?? []).map((s) => s.toLowerCase()));
    return (a ?? []).filter((s) => bl.has(s.toLowerCase())).length;
  };
  const twinOverlap =
    overlap(USER.lifestylePreferences, HOBBY_TWIN.lifestylePreferences) +
    overlap(USER.values, HOBBY_TWIN.values);
  const strangerOverlap =
    overlap(USER.lifestylePreferences, RESONANT_STRANGER.lifestylePreferences) +
    overlap(USER.values, RESONANT_STRANGER.values);
  assert.ok(
    twinOverlap > strangerOverlap,
    `expected hobby-twin overlap (${twinOverlap}) > stranger overlap (${strangerOverlap})`
  );

  // Despite sharing almost nothing on the surface, the emotionally-regulating
  // stranger must out-resonate and out-score the surface twin.
  const twinRes = twin.report.resonanceReport;
  const strangerRes = stranger.report.resonanceReport;
  assert.ok(twinRes && strangerRes);
  assert.ok(
    strangerRes.emotionalResonanceScore > twinRes.emotionalResonanceScore,
    `stranger resonance ${strangerRes.emotionalResonanceScore} should beat twin ${twinRes.emotionalResonanceScore}`
  );
  assert.ok(
    stranger.memory.compatibilityScore > twin.memory.compatibilityScore,
    `stranger compat ${stranger.memory.compatibilityScore} should beat twin ${twin.memory.compatibilityScore}`
  );

  // The regulating dynamic is the reason — calmness meeting intensity — and the
  // clashing pair shows up as nervous-system / recovery friction.
  assert.ok(
    strangerRes.nervousSystemFit.score > twinRes.nervousSystemFit.score,
    "the regulating match should have the better nervous-system fit"
  );
});

// ─── 3. Non-negotiable conflict ──────────────────────────────────────────────

test("non-negotiable conflict stops the meeting and is not recommended", () => {
  const preScreen = buildCandidatePreScreen(USER, PRIYA);
  assert.equal(preScreen.shouldContinue, false);
  assert.ok(preScreen.nonNegotiableConflicts.length > 0);

  const { memory, report } = runShadowMeeting(USER, PRIYA);
  assert.equal(memory.recommendationStatus, "not_recommended");
  assert.ok(memory.nonNegotiableConflicts.some((c) => /children/i.test(c)));
  assert.ok(memory.compatibilityScore <= 35, `compat ${memory.compatibilityScore}`);
  assert.match(report.summary, /non-negotiable/i);
});

// ─── 4. Follow-up meeting uses prior memory ──────────────────────────────────

test("follow-up meeting continues from memory without repeating topics", () => {
  // First meeting: surface + values only, leaving conflict style unresolved
  // (SAM has no conflictStyle).
  const first = runShadowMeeting(USER, SAM, {
    stages: ["surface", "values_rhythm"]
  });
  assert.equal(first.memory.meetingNumber, 1);
  assert.ok(first.memory.unresolvedQuestionsForB.length > 0);
  assert.ok(getNextMeetingAgenda(first.memory).length > 0);

  // Follow-up: no explicit stages → engine picks the next unrun stage.
  const follow = runShadowMeeting(USER, SAM, { prevMemory: first.memory });

  assert.equal(follow.memory.meetingNumber, 2);
  // It did NOT restart at surface — only one new stage ran this round.
  assert.equal(follow.stageResults.length, 1);
  assert.notEqual(follow.stageResults[0].stage, "surface");
  // The opening turn recaps prior state rather than re-introducing.
  assert.match(follow.stageResults[0].exchange[0].content, /Last time we established/i);
  // Prior stages are remembered, not repeated.
  assert.ok(follow.memory.stagesCompleted.includes("surface"));
  assert.ok(follow.memory.stagesCompleted.includes("values_rhythm"));
  assert.ok(follow.memory.topicsCovered.length >= first.memory.topicsCovered.length);

  // A follow-up agenda is framed around the unresolved questions.
  const agenda = generateMeetingAgenda(USER, SAM, "friction_test", first.memory);
  assert.ok(agenda.recap && /unresolved questions/i.test(agenda.recap));
});

// ─── 5. Location / date convenience ──────────────────────────────────────────

test("logistics stage produces a convenient, privacy-safe date suggestion", () => {
  const result = runStructuredShadowMeeting(
    USER,
    MAYA,
    generateMeetingAgenda(USER, MAYA, "logistics")
  );

  const suggestion = result.firstDateSuggestion;
  assert.ok(suggestion, "expected a first-date suggestion");
  assert.ok(suggestion.meetingZone && suggestion.meetingZone.length > 0);
  assert.notEqual(suggestion.travelFriction, undefined);
  // No exact addresses leaked into the exchange — only broad areas.
  for (const msg of result.exchange) {
    assert.doesNotMatch(msg.content, /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/); // UK postcode
  }

  const { memory, report } = runShadowMeeting(USER, MAYA);
  assert.ok(memory.firstDateSuggestion?.meetingZone);
  assert.ok(report.suggestedFirstDate && report.suggestedFirstDate.length > 0);
  assert.ok(report.locationConvenience);
});

// ─── Privacy boundaries ──────────────────────────────────────────────────────

test("sensitive personal history is paraphrased, never disclosed verbatim", () => {
  const { memory, stageResults } = runShadowMeeting(PRIVATE_PERSON, MAYA, {
    stages: ["surface", "values_rhythm"]
  });

  const everything = JSON.stringify({ memory, stageResults });
  assert.doesNotMatch(everything, /Linda/i);
  assert.doesNotMatch(everything, /ketamine/i);
  assert.ok(
    memory.privacyBoundariesHit.length > 0,
    "a privacy boundary should be recorded"
  );
  // The high-level need still came through.
  assert.ok(
    memory.factsLearnedAboutA.some((f) => /emotional consistency/i.test(f))
  );
});

// ─── The Field morning report ────────────────────────────────────────────────

test("a Field night returns a ranked morning report across candidates", () => {
  const night = runFieldNight(USER, [MAYA, SAM, PRIYA], {
    now: new Date("2026-06-02T04:20:00Z")
  });

  assert.equal(night.metCount, 3);
  assert.equal(night.results.length, 3);
  assert.match(night.summary, /met 3 Shadows overnight/i);

  // Maya is the standout; Priya is rejected on a non-negotiable.
  assert.ok(night.worthAttention.some((r) => r.candidate.userId === "u_maya"));
  assert.ok(
    night.rejected.some(
      (r) => r.candidate.userId === "u_priya" && r.memory.nonNegotiableConflicts.length > 0
    )
  );

  // Ranking is sorted by compatibility weighted by confidence.
  const ranked = rankFieldResults(night.results);
  assert.equal(ranked.results[0].candidate.userId, "u_maya");
});

// ─── Cost control: cheap pre-screen for weak candidates ──────────────────────

test("field night does not run deep stages for non-viable candidates", () => {
  const night = runFieldNight(USER, [PRIYA]);
  const priya = night.results.find((r) => r.candidate.userId === "u_priya");
  assert.ok(priya);
  // Only the cheap surface (+handoff) ran — no values/friction/logistics.
  assert.ok(!priya.memory.stagesCompleted.includes("values_rhythm"));
  assert.ok(!priya.memory.stagesCompleted.includes("logistics"));
});
