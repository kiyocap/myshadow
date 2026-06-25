// Adapters that convert the app's existing profile shapes into the
// ShadowProfile the conversation engine reasons over. Kept separate from the
// engine so the engine stays dependency-free and unit-testable.

import type { GeneratedProxyProfile } from "@/lib/ai";
import type { LocalProxyProfile } from "@/lib/proxy-storage";
import { nearbyMatches, type NearbyMatch } from "@/lib/discover-data";

import type { ShadowProfile } from "./types";

function clean(items: Array<string | undefined | null>): string[] {
  return items.filter((x): x is string => Boolean(x && x.trim()));
}

/** A candidate Shadow met in The Field (demo discover data) → ShadowProfile. */
export function nearbyMatchToShadowProfile(match: NearbyMatch): ShadowProfile {
  return {
    userId: match.id,
    displayName: match.name,
    age: match.age,
    locationArea: match.location,
    homeArea: match.location,
    workArea: match.workLocation,
    relationshipIntent: match.relationshipIntent,
    // Prefer the richer structured values; fall back to traits for older records.
    values: clean(match.values && match.values.length ? match.values : match.traits),
    personalityTraits: clean(match.traits),
    communicationStyle: match.communicationStyle,
    humourStyle: match.humourStyle,
    ambitionGoals: clean(match.ambitionGoals ?? []),
    emotionalNeeds: clean(match.emotionalNeeds ?? []),
    lifestylePreferences: clean(match.lifestylePreferences ?? []),
    conflictStyle: match.conflictStyle,
    familyChildrenViews: match.familyChildrenViews,
    datingPatterns: clean(match.datingPatterns ?? []),
    greenFlags: clean(match.greenFlags),
    redFlags: [],
    // The "tread gently" hint is private context the engine may reason over but
    // should only ever surface as a high-level pattern.
    sourceNotes: clean([match.treadGently]),
    shareableFacts: clean([match.verdict, ...match.greenFlags]),
    doNotDisclose: []
  };
}

export function allNearbyShadowProfiles(): ShadowProfile[] {
  return nearbyMatches.map(nearbyMatchToShadowProfile);
}

/** The signed-in user's locally-stored Shadow → ShadowProfile. */
export function localProfileToShadowProfile(
  local: LocalProxyProfile,
  options?: { userId?: string }
): ShadowProfile {
  const profile: GeneratedProxyProfile = local.profile;
  const answers = local.guidedAnswers ?? {};
  const lookingFor = clean(answers.lookingFor ?? []);
  const frustrations = clean(answers.frustrations ?? []);
  const goals = clean(answers.goals ?? []);
  const greatRelationship = clean(answers.greatRelationship ?? []);

  // Best-effort enrichment from guided answers so the user side isn't thin
  // (which otherwise caps match confidence via min(completeness)). We only
  // derive a signal when the user actually selected it — never fabricated.
  const lifestylePreferences = clean([...greatRelationship]);

  let conflictStyle: string | undefined;
  const wantsDirectRepair = greatRelationship.some((g) =>
    /repair after conflict|honest hard conversations/i.test(g)
  );
  const avoidsHard = frustrations.some((f) =>
    /avoided conversations|emotional ambiguity/i.test(f)
  );
  if (wantsDirectRepair || avoidsHard) {
    conflictStyle =
      "Direct — values honest conversations and clear repair after conflict";
  } else if (greatRelationship.some((g) => /mutual independence/i.test(g))) {
    conflictStyle = "Gives space, then talks things through openly";
  }

  let familyChildrenViews: string | undefined;
  if (goals.some((g) => /create a family|start a family|family/i.test(g))) {
    familyChildrenViews = "Wants to start a family someday";
  }

  return {
    userId: options?.userId ?? "me",
    displayName: local.name,
    age: local.age,
    locationArea: local.location ?? local.homeLocation,
    homeArea: local.homeLocation ?? local.location,
    workArea: local.workLocation,
    relationshipIntent: lookingFor.join(", ") || undefined,
    values: clean(profile.values),
    personalityTraits: clean(profile.traits),
    communicationStyle: profile.communicationStyle,
    humourStyle: profile.humourStyle,
    ambitionGoals: clean(profile.goals),
    emotionalNeeds: clean(profile.relationshipPreferences),
    lifestylePreferences,
    conflictStyle,
    familyChildrenViews,
    greenFlags: clean(profile.strengths),
    redFlags: clean(profile.weaknesses),
    lookingFor,
    frustrations,
    nonNegotiables: [],
    shareableFacts: clean([profile.summary]),
    // Raw guided answers are private memory: reason over them, never disclose.
    sourceNotes: clean([
      ...frustrations,
      ...(answers.motivation ?? []),
      ...(answers.greatRelationship ?? [])
    ]),
    doNotDisclose: []
  };
}
