// Self-contained sample ShadowProfiles for demos and for exercising the
// conversation engine without any of the app's storage layers. Pure module
// (no "@/" imports) so it can be used from the browser, server, or tests.

import type { ShadowProfile } from "./types";

export const SAMPLE_USER: ShadowProfile = {
  userId: "user_hewie",
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
  greenFlags: ["Loyal under pressure", "Very transparent when engaged"],
  redFlags: ["Can become consumed by projects"],
  nonNegotiables: ["Must want children eventually"],
  datingPatterns: ["Moves fast and intensely early"],
  lookingFor: ["Someone emotionally consistent", "Room for ambition"],
  frustrations: ["Partners who go cold without explanation"],
  shareableFacts: ["Driven founder type who wants tenderness without losing momentum"],
  doNotDisclose: []
};

export const SAMPLE_CANDIDATES: ShadowProfile[] = [
  {
    // Strong, high-confidence match for Hewie.
    userId: "user_maya",
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
  },
  {
    // Promising but low-confidence — sparse profile.
    userId: "user_nadia",
    displayName: "Nadia",
    age: 30,
    homeArea: "Hackney",
    values: ["Depth", "Craft"],
    personalityTraits: ["Curious"],
    relationshipIntent: "Open to a relationship",
    greenFlags: ["Thoughtful"],
    shareableFacts: ["Quietly creative"],
    doNotDisclose: []
  },
  {
    // Non-negotiable conflict — does not want children.
    userId: "user_priya",
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
    greenFlags: ["Knows exactly what she wants"],
    nonNegotiables: ["Child-free"],
    doNotDisclose: []
  }
];
