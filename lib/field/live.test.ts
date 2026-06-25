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
  // First model call follows the instant opener, so it already sees one prior line.
  assert.equal(transcriptLengths[0], 1);
  assert.ok(transcriptLengths[transcriptLengths.length - 1] > transcriptLengths[0]);
});

test("live meeting completes with instant openers plus model replies", async () => {
  const result = await runLiveMeeting(
    A,
    B,
    undefined,
    makeFakeClient({ verdictScore: 95, capturedUserPrompts: [] }) as any
  );

  assert.equal(result.source, "openai");
  assert.ok(result.transcript.length >= 4, "two stages × opener + reply");
  assert.ok(
    result.transcript.some((m) =>
      /hobby-matching|surface looks plausible|shared interests|awkward moment|pretty version|failure mode|pressure|repair read/i.test(
        m.content
      )
    ),
    "instant openers should land with discussion-shaped prompts before waiting on the model"
  );
  assert.ok(
    result.transcript.some((m) => /line \d+/.test(m.content)),
    "model replies should follow the openers"
  );
  assert.ok(result.run.memory.compatibilityScore >= 0);
});

test("live meeting answers an open question before moving into logistics", async () => {
  const capturedUserPrompts: string[] = [];
  const client = {
    chat: {
      completions: {
        create: async (req: any) => {
          const user: string = req.messages?.[1]?.content ?? "";
          capturedUserPrompts.push(user);
          const payload = JSON.parse(user);
          if (payload.openQuestionToAnswer) {
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      content:
                        "Hewie would welcome Amara taking the lead if it stayed warm and specific, because that makes repair feel collaborative rather than corrective.",
                      intent: "RESOLUTION",
                      learned: ["Hewie can receive direct repair when it feels collaborative"],
                      stillWantToProbe: [],
                      stageGoalMet: true
                    })
                  }
                }
              ]
            };
          }

          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    content:
                      "Amara would name the tension calmly; how does Hewie feel about Amara taking the lead in those moments?",
                    intent: "QUESTION",
                    learned: ["Amara names tension calmly"],
                    stillWantToProbe: ["Hewie's response to Amara leading repair"],
                    stageGoalMet: true
                  })
                }
              }
            ]
          };
        }
      }
    }
  };

  const result = await runLiveMeeting(
    A,
    B,
    { stages: ["friction_test", "logistics"] },
    client as any
  );

  assert.ok(
    capturedUserPrompts.some((prompt) => JSON.parse(prompt).openQuestionToAnswer),
    "the next turn should be explicitly prompted to close the open question"
  );

  const flat = result.run.stageResults.flatMap((stage) => stage.exchange);
  const logisticsIndex = flat.findIndex((message) => message.stage === "logistics");
  assert.ok(logisticsIndex > 0, "logistics should still run after the question is closed");
  assert.equal(flat[logisticsIndex - 1].stage, "friction_test");
  assert.match(flat[logisticsIndex - 1].content, /Hewie would welcome Amara taking the lead/);
  assert.ok(!flat[logisticsIndex - 1].content.includes("?"));
});

test("no client throws — live agents only, no demo fallback", async () => {
  await assert.rejects(
    () => runLiveMeeting(A, B, undefined, null),
    (err: unknown) => err instanceof Error && err.name === "AgentsUnavailableError"
  );
});
