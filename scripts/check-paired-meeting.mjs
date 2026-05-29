import { spawnSync } from "node:child_process";

const baseUrl = process.env.SHADOW_BASE_URL ?? "http://localhost:3000";
const databaseUrl = process.env.SHADOW_DATABASE_URL ?? process.env.DATABASE_URL;
const npmBin = process.env.NPM_CLI_PATH ?? "/private/tmp/shadow-npm/package/bin/npm-cli.js";

if (!databaseUrl) {
  throw new Error("Set SHADOW_DATABASE_URL or DATABASE_URL before running paired meeting checks.");
}

const suffix = Date.now().toString(36);
const inviteCode = `PX-E2E-${suffix}`;
const meetingId = `e2e_meeting_${suffix}`;
const userAId = `e2e_user_a_${suffix}`;
const userBId = `e2e_user_b_${suffix}`;
const proxyAId = `e2e_proxy_a_${suffix}`;
const proxyBId = `e2e_proxy_b_${suffix}`;
const participantAId = `e2e_participant_a_${suffix}`;
const participantBId = `e2e_participant_b_${suffix}`;
const names = [`Avery ${suffix}`, `Morgan ${suffix}`];
const emails = [
  `avery-${suffix}@example.invalid`,
  `morgan-${suffix}@example.invalid`
];

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function jsonSql(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function profileFor(name, tone) {
  return {
    values:
      tone === "depth"
        ? ["Depth", "Candour", "Creative momentum"]
        : ["Consistency", "Emotional steadiness", "Warmth"],
    traits:
      tone === "depth"
        ? ["Introspective", "Ambitious", "Direct"]
        : ["Thoughtful", "Reliable", "Curious"],
    goals:
      tone === "depth"
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

function proxyInsert({
  id,
  userId,
  name,
  age,
  occupation,
  tone
}) {
  const profile = profileFor(name, tone);

  return `
INSERT INTO "Proxy" (
  "id",
  "userId",
  "displayName",
  "age",
  "occupation",
  "location",
  "motivation",
  "frustrations",
  "goals",
  "lookingFor",
  "greatRelationship",
  "values",
  "traits",
  "generatedProfile",
  "communicationStyle",
  "humourStyle",
  "strengths",
  "weaknesses",
  "relationshipPreferences",
  "summary",
  "embeddingStatus",
  "updatedAt"
) VALUES (
  ${sqlString(id)},
  ${sqlString(userId)},
  ${sqlString(name)},
  ${age},
  ${sqlString(occupation)},
  'London',
  ${sqlString(profile.goals.join(", "))},
  ${sqlString(
    tone === "depth"
      ? "Shallow communication, inconsistency, and avoided conversations."
      : "Ambiguity, unreliability, and emotional whiplash."
  )},
  ${sqlString(profile.goals.join(", "))},
  ${sqlString(profile.relationshipPreferences.join(", "))},
  'A relationship with honest repair, mutual respect, and enough curiosity to keep learning.',
  ${jsonSql(profile.values)},
  ${jsonSql(profile.traits)},
  ${jsonSql(profile)},
  ${sqlString(profile.communicationStyle)},
  ${sqlString(profile.humourStyle)},
  ${jsonSql(profile.strengths)},
  ${jsonSql(profile.weaknesses)},
  ${jsonSql(profile.relationshipPreferences)},
  ${sqlString(profile.summary)},
  'e2e',
  NOW()
);`;
}

function execSql(sql, label) {
  const result = spawnSync(
    npmBin,
    ["exec", "--yes", "prisma", "--", "db", "execute", "--stdin", "--url", databaseUrl],
    {
      input: sql,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"]
    }
  );

  if (result.status !== 0) {
    throw new Error(`${label} failed: ${result.stderr || result.stdout}`);
  }
}

const createSql = `
INSERT INTO "User" ("id", "name", "email", "updatedAt") VALUES
  (${sqlString(userAId)}, ${sqlString(names[0])}, ${sqlString(emails[0])}, NOW()),
  (${sqlString(userBId)}, ${sqlString(names[1])}, ${sqlString(emails[1])}, NOW());

${proxyInsert({
  id: proxyAId,
  userId: userAId,
  name: names[0],
  age: 31,
  occupation: "Founder",
  tone: "depth"
})}

${proxyInsert({
  id: proxyBId,
  userId: userBId,
  name: names[1],
  age: 29,
  occupation: "Designer",
  tone: "steady"
})}

INSERT INTO "Meeting" ("id", "inviteCode") VALUES
  (${sqlString(meetingId)}, ${sqlString(inviteCode)});

INSERT INTO "MeetingParticipant" ("id", "meetingId", "proxyId", "role") VALUES
  (${sqlString(participantAId)}, ${sqlString(meetingId)}, ${sqlString(proxyAId)}, 'A'),
  (${sqlString(participantBId)}, ${sqlString(meetingId)}, ${sqlString(proxyBId)}, 'B');
`;

const cleanupSql = `
DELETE FROM "Meeting" WHERE "id" = ${sqlString(meetingId)};
DELETE FROM "User" WHERE "id" IN (${sqlString(userAId)}, ${sqlString(userBId)});
`;

try {
  execSql(createSql, "seed paired meeting");

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
  execSql(cleanupSql, "cleanup paired meeting");
}
