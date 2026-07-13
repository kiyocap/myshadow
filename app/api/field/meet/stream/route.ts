import { z } from "zod";

import { nearbyMatches } from "@/lib/discover-data";
import {
  localProfileToShadowProfile,
  nearbyMatchToShadowProfile
} from "@/lib/field/adapters";
import { streamLiveMeeting } from "@/lib/field/live";
import type { LocalProxyProfile } from "@/lib/proxy-storage";

// A live meeting fires many sequential turn calls plus a verdict pass, so allow
// more headroom than the one-shot route. NOTE: serverless platforms cap this
// (Vercel needs an appropriate plan/`maxDuration`); local dev has no cap.
export const maxDuration = 300;

const generatedProfileSchema = z
  .object({
    values: z.array(z.string()).default([]),
    traits: z.array(z.string()).default([]),
    goals: z.array(z.string()).default([]),
    communicationStyle: z.string().default(""),
    humourStyle: z.string().default(""),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    relationshipPreferences: z.array(z.string()).default([]),
    summary: z.string().default("")
  })
  .passthrough();

const bodySchema = z.object({
  candidateId: z.string().min(1),
  localProfile: z
    .object({
      name: z.string().min(1),
      age: z.number().optional(),
      location: z.string().optional(),
      homeLocation: z.string().optional(),
      workLocation: z.string().optional(),
      profile: generatedProfileSchema,
      guidedAnswers: z.record(z.array(z.string())).optional()
    })
    .passthrough()
});

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid meeting request", issues: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const match = nearbyMatches.find((m) => m.id === parsed.data.candidateId);
  if (!match) {
    return new Response(JSON.stringify({ error: "Candidate not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const user = localProfileToShadowProfile(
    parsed.data.localProfile as unknown as LocalProxyProfile
  );
  const candidate = nearbyMatchToShadowProfile(match);

  const participants = {
    userName: user.displayName ?? "Your Shadow",
    candidateName: candidate.displayName ?? match.name,
    candidate: {
      id: match.id,
      name: match.name,
      age: match.age,
      occupation: match.occupation,
      location: match.location
    }
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));
      try {
        for await (const event of streamLiveMeeting(user, candidate)) {
          switch (event.type) {
            case "meta":
              send("meta", {
                source: event.source,
                preScreen: event.preScreen,
                participants
              });
              break;
            case "stage":
              send("stage", {
                stage: event.stage,
                label: event.label,
                index: event.index,
                total: event.total
              });
              break;
            case "turn":
              send("turn", event.message);
              break;
            case "verdict": {
              const { run } = event;
              // The verdict carries the full one-shot-compatible payload so the
              // client can reuse all of its existing decoding/persistence.
              send("verdict", {
                source: event.source,
                preScreen: run.preScreen,
                stageResults: run.stageResults.map((s) => ({
                  stage: s.stage,
                  exchange: s.exchange
                })),
                memory: run.memory,
                report: run.report,
                participants
              });
              break;
            }
            case "error":
              send("error", { error: event.error });
              break;
          }
        }
        send("done", {});
      } catch (error) {
        send("error", {
          error:
            error instanceof Error
              ? error.message
              : "The Shadow meeting could not be generated. Please retry in a moment."
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
