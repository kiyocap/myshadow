// Tests for the live, turn-by-turn Shadow meeting engine.
//
// Run with Node 22's native TypeScript support:
//   node --experimental-strip-types --test lib/field/live.test.ts
//
// These tests inject a FAKE OpenAI client (no real key / network) so the
// sequential turn loop and the verdict-blend can be verified deterministically.

import assert from "node:assert/strict";
import { test } from "node:test";

import { runLiveMeeting, streamLiveMeeting } from "./live.ts";
import type { ShadowProfile } from "./types.ts";

const A: ShadowProfile = {
  userId: "u_alex",
  displayName: "Alex",
  age: 31,
  homeArea: "Islington",
  workArea: "Kings Cross",
  relationshipIntent: "Looking for something serious and long-term",
  values: ["Growth", "Honesty", "Ambition", "Loyalty"],
  personalityTraits: ["Driven", "Intense", "Warm", "Curious"],
  communicationStyle: "Direct and fast",
  humourStyle: "Playful and quick",
  ambitionGoals: ["Build a company"],
  emotionalNeeds: ["Emotional consistency"],
  lifestylePreferences: ["Always busy"],
  conflictStyle: "Direct, talks it out",
  familyChildrenViews: "Wants a family someday",
  greenFlags: ["Shows up consistently"],
  nonNegotiables: ["Must want children eventually"],
  datingPatterns: ["Falls hard fast"],
  lookingFor: ["Something serious"],
  shareableFacts: ["Ambitious founder who wants something real"],
  doNotDisclose: ["bankruptcy"],
  sourceNotes: ["went through a bankruptcy he is ashamed of"]
};

const B: ShadowProfile = {
  userId: "u_clara",
  displayName: "Clara",
  age: 29,
  homeArea: "Shoreditch",
  workArea: "Hoxton",
  relationshipIntent: "Looking for a serious, long-term partnership",
  values: ["Craft", "Loyalty", "Steadiness", "Depth"],
  personalityTraits: ["Measured", "Creative", "Loyal"],
  communicationStyle: "Calm, thinks before responding",
  humourStyle: "Dry and understated",
  ambitionGoals: ["Lead her own practice"],
  emotionalNeeds: ["Room to process", "Emotional consistency"],
  lifestylePreferences: ["Predictable routines", "Calm evenings"],
  conflictStyle: "Processes quietly then talks it out",
  familyChildrenViews: "Wants children someday",
  greenFlags: ["Deliberate recovery"],
  datingPatterns: ["Takes time to open up"],
  shareableFacts: ["Measured architect who values steadiness"]
};

/**
 * A fake OpenAI chat client. Records every prompt it is asked to complete so a
 * test can assert that each turn was fed the full prior transcript. Produces a
 * deterministic next line and a fixed verdict score.
 */
function makeFakeClient(opts: { verdictScore: number; capturedUserPrompts: string[] }) {
  let turnIndex = 0;
  return {
    chat: {
      completions: {
        create: async (req: any) => {
          const system: string = req.messages?.[0]?.content ?? "";
          const user: string = req.messages?.[1]?.content ?? "";
          const isVerdict = system.includes("verdict engine");

          if (isVerdict) {
            const payload = JSON.parse(user);
            const stages: string[] = payload.stagesCovered ?? [];
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      emotionalResonanceScore: opts.verdictScore,
                      resonanceRationale: "Graded from the live transcript.",
                      perStage: stages.map((stage) => ({
                        stage,
                        alignment: [`Aligned during ${stage}.`],
                        friction: [],
                        factsAboutA: [`Alex showed up in ${stage}.`],
                        factsAboutB: [`Clara engaged in ${stage}.`],
                        unresolvedForA: [],
                        unresolvedForB: []
                      }))
                    })
                  }
                }
              ]
            };
          }

          // A turn call: capture the prompt and emit a context-aware line.
          opts.capturedUserPrompts.push(user);
          const payload = JSON.parse(user);
          const priorTurns: Array<{ speaker: string; line: string }> =
            payload.transcriptSoFar ?? [];
          const speaker: string = payload.you ?? "?";
          turnIndex += 1;
          const reactingTo = priorTurns.length
            ? ` Reacting to: "${priorTurns[priorTurns.length - 1].line}".`
            : " Opening the conversation.";
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    content: `${speaker} line ${turnIndex}.${reactingTo}`,
                    intent: priorTurns.length === 0 ? "CLAIM" : "QUESTION",
                    learned: priorTurns.length ? ["something new"] : [],
                    stillWantToProbe: [],
                    // End each stage after both have spoken a couple of times.
                    stageGoalMet: priorTurns.length >= 3
                  })
                }
              }
            ]
          };
        }
      }
    }
  };
}

test("live meeting streams sequential turns, each fed the full prior transcript", async () => {
  const capturedUserPrompts: string[] = [];
  const client = makeFakeClient({ verdictScore: 88, capturedUserPrompts });

  const turns: Array<{ speaker: string; content: string }> = [];
  let sawVerdict = false;
  for await (const event of streamLiveMeeting(A, B, undefined, client as any)) {
    if (event.type === "turn") {
      turns.push({ speaker: event.message.speakerLabel, content: event.message.content });
    } else if (event.type === "verdict") {
      sawVerdict = true;
    }
  }

  assert.ok(turns.length >= 4, "should produce multiple live turns");
  assert.ok(sawVerdict, "should emit a verdict");

  // Turns alternate between the two Shadows.
  assert.equal(turns[0].speaker, "Alex's Shadow");
  assert.equal(turns[1].speaker, "Clara's Shadow");

  // Each successive turn was fed a transcript at least as long as the previous,
  // i.e. turns genuinely build on the unfolding conversation rather than running
  // in parallel over a fixed skeleton.
  const transcriptLengths = capturedUserPrompts.map(
    (p) => (JSON.parse(p).transcriptSoFar as unknown[]).length
  );
  for (let i = 1; i < transcriptLengths.length; i++) {
    assert.ok(
      transcriptLengths[i] >= transcriptLengths[i - 1],
      "later turns must see at least as much transcript as earlier ones"
    );
  }
  // The very first turn sees an empty transcript; a later turn sees prior lines.
  assert.equal(transcriptLengths[0], 0);
  assert.ok(transcriptLengths[transcriptLengths.length - 1] > 0);
});

test("verdict score from the live exchange moves the final compatibility", async () => {
  const high = await runLiveMeeting(
    A,
    B,
    undefined,
    makeFakeClient({ verdictScore: 95, capturedUserPrompts: [] }) as any
  );
  const low = await runLiveMeeting(
    A,
    B,
    undefined,
    makeFakeClient({ verdictScore: 20, capturedUserPrompts: [] }) as any
  );

  assert.equal(high.source, "openai");
  assert.ok(
    high.run.memory.compatibilityScore > low.run.memory.compatibilityScore,
    `a strong live read (${high.run.memory.compatibilityScore}) should beat a weak one (${low.run.memory.compatibilityScore})`
  );

  // The live transcript (not the deterministic skeleton) is what surfaces.
  assert.ok(high.transcript.length >= 4);
  assert.ok(high.transcript.every((m) => /line \d+/.test(m.content)));
});

test("no client degrades gracefully to the deterministic demo path", async () => {
  const result = await runLiveMeeting(A, B, undefined, null);
  assert.equal(result.source, "demo");
  assert.ok(result.run.memory.compatibilityScore >= 0);
  assert.ok(result.transcript.length > 0, "demo path still streams turns");
});
