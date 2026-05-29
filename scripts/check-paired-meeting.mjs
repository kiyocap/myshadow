import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.SHADOW_BASE_URL ?? "http://localhost:3000";
const databaseUrl = process.env.SHADOW_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Set SHADOW_DATABASE_URL or DATABASE_URL before running paired meeting checks.");
}

const db = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

const suffix = Date.now().toString(36);
const inviteCode = `PX-E2E-${suffix}`;
const names = [`Avery ${suffix}`, `Morgan ${suffix}`];
const userEmails = [
  `avery-${suffix}@example.invalid`,
  `morgan-${suffix}@example.invalid`
];

function profileFor(name, tone) {
  return {
    values: tone === "depth"
      ? ["Depth", "Candour", "Creative momentum"]
      : ["Consistency", "Emotional steadiness", "Warmth"],
    traits: tone === "depth"
      ? ["Introspective", "Ambitious", "Direct"]
      : ["Thoughtful", "Reliable", "Curious"],
    goals: tone === "depth"
      ? ["Build meaningful work", "Find a serious connection"]
      : ["Create a calm partnership", "Grow with someone ambitious"],
    communicationStyle:
      tone === "depth"
        ? `${name} prefers direct questions, precise language, and room to think deeply.`
        : `${name} prefers calm specificity, reassurance, and follow-through.`,
    humourStyle: tone === "depth" ? "Dry and associative" : "Warm and quietly playful",
    strengths:
      tone === "depth"
        ? ["Pattern recognition", "Intensity", "Honesty"]
        : ["Consistency", "Care", "Repair after conflict"],
    weaknesses:
      tone === "depth"
        ? ["Can move too fast", "May over-focus on projects"]
        : ["Can overthink ambiguity", "May wait too long to name needs"],
    relationshipPreferences:
      tone === "depth"
        ? ["Intellectual honesty", "Shared ambition", "Emotional directness"]
        : ["Reliability", "Kindness under pressure", "Clear communication"],
    summary:
      tone === "depth"
        ? `${name} wants a connection with depth, creative momentum, and honest repair.`
        : `${name} wants a connection that feels steady, caring, and emotionally specific.`
  };
}

async function createProxy(name, email, tone) {
  const profile = profileFor(name, tone);
  const user = await db.user.create({
    data: {
      email,
      name,
      proxy: {
        create: {
          displayName: name,
          age: tone === "depth" ? 31 : 29,
          occupation: tone === "depth" ? "Founder" : "Designer",
          location: "London",
          motivation: profile.goals.join(", "),
          frustrations:
            tone === "depth"
              ? "Shallow communication, inconsistency, and avoided conversations."
              : "Ambiguity, unreliability, and emotional whiplash.",
          goals: profile.goals.join(", "),
          lookingFor: profile.relationshipPreferences.join(", "),
          greatRelationship:
            "A relationship with honest repair, mutual respect, and enough curiosity to keep learning.",
          values: profile.values,
          traits: profile.traits,
          generatedProfile: profile,
          communicationStyle: profile.communicationStyle,
          humourStyle: profile.humourStyle,
          strengths: profile.strengths,
          weaknesses: profile.weaknesses,
          relationshipPreferences: profile.relationshipPreferences,
          summary: profile.summary,
          embeddingStatus: "e2e"
        }
      }
    },
    include: { proxy: true }
  });

  if (!user.proxy) {
    throw new Error(`Failed to create proxy for ${name}`);
  }

  return user;
}

let meetingId;

try {
  const [userA, userB] = await Promise.all([
    createProxy(names[0], userEmails[0], "depth"),
    createProxy(names[1], userEmails[1], "steady")
  ]);

  const meeting = await db.meeting.create({
    data: {
      inviteCode,
      participants: {
        create: [
          { proxyId: userA.proxy.id, role: "A" },
          { proxyId: userB.proxy.id, role: "B" }
        ]
      }
    }
  });
  meetingId = meeting.id;

  const response = await fetch(`${baseUrl}/api/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meetingId })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Meeting generation failed with ${response.status}: ${JSON.stringify(data)}`
    );
  }

  const serialized = JSON.stringify(data);

  for (const name of names) {
    if (!serialized.includes(name)) {
      throw new Error(`Generated meeting did not include ${name}.`);
    }
  }

  for (const placeholder of ["Hayley", "Emily"]) {
    if (serialized.includes(placeholder)) {
      throw new Error(`Generated real meeting leaked placeholder name: ${placeholder}.`);
    }
  }

  if (data.source !== "openai") {
    throw new Error(`Expected OpenAI source, got ${data.source}.`);
  }

  if (!Array.isArray(data.transcript) || data.transcript.length < 12) {
    throw new Error("Generated meeting transcript was too short.");
  }

  console.log(`Paired meeting check passed for ${baseUrl}`);
} finally {
  await db.meeting
    .deleteMany({ where: { inviteCode } })
    .catch(() => undefined);
  await db.user
    .deleteMany({ where: { email: { in: userEmails } } })
    .catch(() => undefined);
  await db.$disconnect();
}
