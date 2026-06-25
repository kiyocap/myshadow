// Shadow-to-Shadow conversation engine — core data structures.
//
// This module defines the *protocol* types used when two users' Shadows meet
// in The Field. The meeting is deliberately NOT a freeform chat: it runs as a
// staged, stateful compatibility protocol that produces a structured
// MeetingMemory and a human-facing ShadowMatchReport.

// ─── Enumerated values (kept as string-literal unions so the file is pure,
// erasable TypeScript and runs under Node's native type stripping) ───────────

export type RecommendationStatus =
  | "recommended"
  | "not_recommended"
  | "needs_follow_up"
  | "insufficient_data";

/** How freely a piece of information may be shared during an agent meeting. */
export type PrivacyLevel = "public" | "shareable" | "sensitive";

export type TravelFriction = "low" | "medium" | "high" | "unknown";

/** The ordered stages of a Shadow-to-Shadow compatibility meeting. */
export type MeetingStage =
  | "surface" // 1. Surface compatibility — is this even plausible?
  | "values_rhythm" // 2. Values and emotional rhythm
  | "friction_test" // 3. Stress-test likely future tension
  | "logistics" // 4. Date practicality / convenience
  | "handoff"; // 5. Human handoff — final recommendation

export const MEETING_STAGES: MeetingStage[] = [
  "surface",
  "values_rhythm",
  "friction_test",
  "logistics",
  "handoff"
];

export const STAGE_LABELS: Record<MeetingStage, string> = {
  surface: "Surface compatibility",
  values_rhythm: "Values & emotional rhythm",
  friction_test: "Friction test",
  logistics: "Logistics & date practicality",
  handoff: "Human handoff"
};

/** Structured intents an agent turn can take. Prevents free-form rambling. */
export type ExchangeIntent =
  | "CLAIM"
  | "QUESTION"
  | "EVIDENCE"
  | "CONCERN"
  | "RESOLUTION"
  | "FOLLOW_UP";

export type EvidenceType = "profile" | "inference" | "pattern" | "logistics";

// ─── Emotional-resonance layer ───────────────────────────────────────────────
//
// Shadow's thesis: dating apps match by surface similarity; Shadow measures
// emotional resonance — how two people actually affect each other. These types
// describe that resonance. Hobbies/interests are deliberately NOT part of it;
// values/intent live in `valuesPreview` as things to explore later, never as
// score drivers.

/** The felt emotional effect one person tends to have on the other. */
export type EmotionalEffect =
  | "calming"
  | "energising"
  | "exciting"
  | "safe"
  | "stressful"
  | "boring"
  | "confusing"
  | "addictive/intense"
  | "grounding"
  | "playful";

/** How a conversation recovers after an awkward or tense moment. */
export type ConversationRecoveryRating =
  | "easy recovery"
  | "playful recovery"
  | "forced recovery"
  | "unresolved tension"
  | "avoidance"
  | "rupture";

/** Whether a trait reaction lands well, badly, or both. */
export type TraitReactionValence = "positive" | "negative" | "mixed";

/** Nervous-system level read of how the other person makes you feel. */
export type NervousSystemEffect =
  | "relaxed"
  | "grounded"
  | "playful"
  | "anxious"
  | "judged"
  | "performative"
  | "safe"
  | "activated";

/** The dominant feeling left over once the meeting ends. */
export type ResidueFeeling =
  | "warmth"
  | "curiosity"
  | "calm"
  | "excitement"
  | "uncertainty"
  | "relief it ended"
  | "desire to continue";

/** How one person's specific trait lands in the other person. */
export interface TraitReaction {
  /** The trait being reacted to (usually the OTHER person's trait). */
  trait: string;
  /** Whose trait this is (a display name or "you"/"them"). */
  fromUser: string;
  /** The reaction that trait produces in the other person. */
  reactionInOther: string;
  positiveOrNegative: TraitReactionValence;
  notes: string;
}

export interface ConversationRecovery {
  rating: ConversationRecoveryRating;
  notes: string;
}

export interface CuriosityPull {
  /** 0–100 how much intrigue / pull is left over. */
  score: number;
  unresolvedQuestions: string[];
  followUpTopics: string[];
  wantsAnotherMeeting: boolean;
}

export interface NervousSystemFit {
  /** 0–100 how regulating (vs activating) the other person is. */
  score: number;
  effects: NervousSystemEffect[];
  notes: string;
}

export interface PostMeetingResidue {
  primaryFeeling: ResidueFeeling;
  secondaryFeelings: string[];
  /** 0–100 how much the user would want to keep going. */
  desireToContinueScore: number;
}

/**
 * Values and intent live HERE, as things to explore later — never as drivers of
 * the resonance score. This keeps the score about emotional effect, not overlap.
 */
export interface ValuesPreview {
  likelyAlignment: string[];
  likelyFriction: string[];
  needsLaterDiscussion: string[];
}

/**
 * The canonical resonance contract (camelCase; identical on iOS). Compatibility
 * is driven by `emotionalResonanceScore`, which is itself synthesised from how
 * the two people affect each other — not from shared hobbies or interests.
 */
export interface ResonanceReport {
  emotionalEffects: EmotionalEffect[];
  /** 0–100 — THE MAIN SCORE. */
  emotionalResonanceScore: number;
  conversationRecovery: ConversationRecovery;
  traitReactions: TraitReaction[];
  curiosityPull: CuriosityPull;
  nervousSystemFit: NervousSystemFit;
  postMeetingResidue: PostMeetingResidue;
  valuesPreview: ValuesPreview;
  overallResonanceSummary: string;
}

// ─── Shadow profile (the agent's memory model for one user) ──────────────────

/**
 * A Shadow's view of its own user. Note the three-tier privacy separation:
 *  - everything here is the Shadow's PRIVATE memory used to reason
 *  - `shareableFacts` is what the user approved for compatibility screening
 *  - `doNotDisclose` is sensitive material that must never be exposed verbatim
 *  - `sourceNotes` are raw private notes (the "trauma dump") — reason over them
 *    internally, but only ever disclose high-level paraphrases.
 */
export interface ShadowProfile {
  userId: string;
  displayName?: string;
  age?: number;
  locationArea?: string;
  workArea?: string;
  homeArea?: string;
  relationshipIntent?: string;
  values: string[];
  personalityTraits: string[];
  communicationStyle?: string;
  humourStyle?: string;
  ambitionGoals?: string[];
  lifestylePreferences?: string[];
  emotionalNeeds?: string[];
  conflictStyle?: string;
  familyChildrenViews?: string;
  greenFlags?: string[];
  redFlags?: string[];
  nonNegotiables?: string[];
  datingPatterns?: string[];
  lookingFor?: string[];
  frustrations?: string[];
  travelTolerance?: TravelFriction;
  preferredFirstDate?: string;
  /** Approved-for-sharing summary statements. */
  shareableFacts?: string[];
  /** Substrings that must never appear verbatim in any disclosure. */
  doNotDisclose?: string[];
  confidenceByCategory?: Record<string, number>;
  /** Raw private notes. Reason over them, never disclose verbatim. */
  sourceNotes?: string[];
}

// ─── A single structured turn in the agent exchange ──────────────────────────

export interface ExchangeMessage {
  stage: MeetingStage;
  /** userId of the speaking Shadow's user. */
  speaker: string;
  speakerLabel: string;
  intent: ExchangeIntent;
  content: string;
  evidenceType: EvidenceType;
  privacyLevel: PrivacyLevel;
  extractedFacts: string[];
}

// ─── Stage 1 output ──────────────────────────────────────────────────────────

export interface PreScreenResult {
  shouldContinue: boolean;
  obviousMatches: string[];
  obviousConflicts: string[];
  nonNegotiableConflicts: string[];
  missingInformation: string[];
  stageToRunNext: MeetingStage;
  /** 0–100 cheap plausibility score. */
  surfaceScore: number;
  reasons: string[];
}

// ─── Agenda for a stage ──────────────────────────────────────────────────────

export interface MeetingAgenda {
  stage: MeetingStage;
  topics: string[];
  questionsForA: string[];
  questionsForB: string[];
  privacyWarnings: string[];
  expectedOutputs: string[];
  /** A recap line used for follow-up meetings so we never restart at intros. */
  recap?: string;
}

// ─── Output of running one structured stage ──────────────────────────────────

export interface StructuredMeetingResult {
  stage: MeetingStage;
  exchange: ExchangeMessage[];
  alignment: string[];
  friction: string[];
  factsAboutA: string[];
  factsAboutB: string[];
  unresolvedForA: string[];
  unresolvedForB: string[];
  nonNegotiableConflicts: string[];
  privacyBoundariesHit: string[];
  /** 0–100 confidence in the conclusions of THIS stage. */
  stageConfidence: number;
  firstDateSuggestion?: FirstDateSuggestion;
}

export interface FirstDateSuggestion {
  meetingZone?: string;
  dateType?: string;
  reasoning?: string;
  travelFriction?: TravelFriction;
  backup?: string;
}

// ─── Persistent meeting state ────────────────────────────────────────────────

export interface MeetingMemory {
  meetingId: string;
  pairId: string;
  userAId: string;
  userBId: string;
  stagesCompleted: string[];
  topicsCovered: string[];
  factsLearnedAboutA: string[];
  factsLearnedAboutB: string[];
  areasOfAlignment: string[];
  areasOfFriction: string[];
  unresolvedQuestionsForA: string[];
  unresolvedQuestionsForB: string[];
  nonNegotiableConflicts: string[];
  privacyBoundariesHit: string[];
  /** 0–100 how promising the match looks. */
  compatibilityScore: number;
  /** 0–100 how much evidence the system has. */
  confidenceScore: number;
  nextMeetingAgenda: string[];
  recommendationStatus: RecommendationStatus;
  firstDateSuggestion?: FirstDateSuggestion;
  humanReport?: ShadowMatchReport;
  /** Meeting number for this pair (1 = first meeting). */
  meetingNumber: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Human-facing report ─────────────────────────────────────────────────────

export interface ShadowMatchReport {
  headline: string;
  summary: string;
  recommendationStatus: RecommendationStatus;
  compatibilityScore: number;
  confidenceScore: number;
  whyYourShadowPickedThem: string[];
  areasOfAlignment: string[];
  potentialFriction: string[];
  greenFlags: string[];
  redFlags: string[];
  questionsToAskInPerson: string[];
  whatNotToOverdo: string[];
  suggestedFirstMessage?: string;
  suggestedFirstDate?: string;
  locationConvenience?: string;
  whatYourShadowStillNeedsToKnow: string[];
  /**
   * Optional emotional-resonance breakdown. Additive and backward-compatible:
   * it flows through `memory.humanReport` and the meet-route response
   * automatically. When present, it is the real basis for `compatibilityScore`.
   */
  resonanceReport?: ResonanceReport;
}

// ─── The Field (overnight run) ───────────────────────────────────────────────

export interface FieldCandidateResult {
  pairId: string;
  candidate: ShadowProfile;
  memory: MeetingMemory;
  report: ShadowMatchReport;
  compatibilityScore: number;
  confidenceScore: number;
  recommendationStatus: RecommendationStatus;
}

export interface FieldNightResult {
  userId: string;
  metCount: number;
  worthAttention: FieldCandidateResult[];
  followUps: FieldCandidateResult[];
  rejected: FieldCandidateResult[];
  results: FieldCandidateResult[];
  summary: string;
  generatedAt: string;
}

export interface FieldNightOptions {
  /** Memories from previous nights, keyed by pairId. */
  priorMemories?: Record<string, MeetingMemory>;
  /** Surface score required to run the medium (values + friction) stages. */
  shortlistThreshold?: number;
  /** Compatibility score required to run the deep (logistics + handoff) stages. */
  deepDiveThreshold?: number;
  now?: Date;
}
