import { PrismaClient } from "@prisma/client";

const baseUrl = (process.env.SHADOW_BASE_URL ?? "https://meetmyshadow.vercel.app").replace(/\/$/, "");
const databaseUrl = process.env.SHADOW_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Set SHADOW_DATABASE_URL or DATABASE_URL to the deployed production database.");
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } }
});

const runId = `prod_smoke_${Date.now()}`;
const requiredMigrations = [
  "20260622111500_add_mobile_chat",
  "20260625100000_add_mobile_blocks",
  "20260625103000_add_safety_reports"
];
const requiredTables = [
  "User",
  "Account",
  "Session",
  "Proxy",
  "MatchLike",
  "ChatThread",
  "ChatMessage",
  "UserBlock",
  "SafetyReport"
];
const createdUserIds = new Set();
const createdReportIds = new Set();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function b64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function invalidAppleIdentityToken() {
  const now = Math.floor(Date.now() / 1000);
  return [
    b64url({ alg: "RS256", kid: `${runId}_missing_key` }),
    b64url({
      iss: "https://appleid.apple.com",
      aud: "com.humanityone.shadow",
      exp: now + 300,
      sub: `${runId}.apple.invalid`
    }),
    "invalid_signature"
  ].join(".");
}

async function request(path, method, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text.slice(0, 240) };
  }
  return { status: response.status, payload };
}

async function post(path, body) {
  return request(path, "POST", body);
}

async function del(path, body) {
  return request(path, "DELETE", body);
}

async function expectStatus(label, actual, expected) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  assert(
    allowed.includes(actual.status),
    `${label} expected ${allowed.join("/")} got ${actual.status}: ${JSON.stringify(actual.payload)}`
  );
}

function profileFor(name) {
  return {
    values: ["Honesty", "Care", "Curiosity"],
    traits: ["Thoughtful", "Direct", "Warm"],
    goals: ["Production smoke test"],
    communicationStyle: `${name} communicates clearly.`,
    humourStyle: "Dry",
    strengths: ["Reliability"],
    weaknesses: ["Impatience"],
    relationshipPreferences: ["Mutual respect"],
    summary: `${name} is a production smoke-test Shadow account.`
  };
}

async function createLiveUser(label) {
  const id = `${runId}_${label}`;
  const appleUserId = `${runId}.${label}.apple`;
  const email = `${runId}.${label}@example.invalid`;
  const name = `Smoke ${label.toUpperCase()}`;
  const sessionToken = `mobile_${runId}_${label}`;
  const profile = profileFor(name);
  createdUserIds.add(id);

  await prisma.user.upsert({
    where: { id },
    create: { id, email, name },
    update: { email, name }
  });
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "apple",
        providerAccountId: appleUserId
      }
    },
    create: {
      userId: id,
      type: "oauth",
      provider: "apple",
      providerAccountId: appleUserId
    },
    update: { userId: id }
  });
  await prisma.session.upsert({
    where: { sessionToken },
    create: {
      sessionToken,
      userId: id,
      expires: new Date(Date.now() + 60 * 60 * 1000)
    },
    update: {
      userId: id,
      expires: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
  await prisma.proxy.upsert({
    where: { userId: id },
    create: {
      userId: id,
      displayName: name,
      age: 30,
      occupation: "Smoke tester",
      location: "London",
      motivation: "Verify the deployed production database.",
      frustrations: "Unverified release infrastructure.",
      goals: "Confirm live database-backed features.",
      lookingFor: "A clean release candidate.",
      greatRelationship: "Clear, mutual, and tested.",
      values: profile.values,
      traits: profile.traits,
      generatedProfile: profile,
      communicationStyle: profile.communicationStyle,
      humourStyle: profile.humourStyle,
      strengths: profile.strengths,
      weaknesses: profile.weaknesses,
      relationshipPreferences: profile.relationshipPreferences,
      summary: profile.summary,
      embeddingStatus: "smoke"
    },
    update: {
      displayName: name,
      generatedProfile: profile,
      summary: profile.summary
    }
  });

  return {
    id,
    name,
    email,
    appleUserId,
    identity: {
      mobileSessionToken: sessionToken,
      appleUserId,
      email,
      displayName: name
    },
    candidate: {
      userId: id,
      name,
      occupation: "Smoke tester",
      location: "London",
      sharedResonance: "Production smoke test",
      trait: "Careful"
    }
  };
}

async function assertMigrationsAndTables() {
  const migrations = await prisma.$queryRawUnsafe(
    'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL'
  );
  const applied = new Set(migrations.map((row) => row.migration_name));
  for (const migration of requiredMigrations) {
    assert(applied.has(migration), `Production DB is missing migration ${migration}`);
  }

  const tableList = requiredTables.map((table) => `'${table.replaceAll("'", "''")}'`).join(", ");
  const tables = await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (${tableList})`
  );
  const existing = new Set(tables.map((row) => row.table_name));
  for (const table of requiredTables) {
    assert(existing.has(table), `Production DB is missing table ${table}`);
  }
}

async function assertUnauthenticatedRoutes() {
  await expectStatus(
    "invalid Apple session route",
    await post("/api/mobile/session", {
      identityToken: invalidAppleIdentityToken(),
      appleUserId: `${runId}.apple.invalid`
    }),
    [401, 503]
  );
  await expectStatus("guest chats", await post("/api/mobile/chats", { identity: {} }), 401);
  await expectStatus("guest matches", await post("/api/mobile/matches", { identity: {} }), 401);
  await expectStatus(
    "guest likes",
    await post("/api/mobile/likes", {
      identity: {},
      candidate: { userId: "nobody", name: "Nobody" }
    }),
    401
  );
  await expectStatus(
    "guest blocks",
    await post("/api/mobile/blocks", { identity: {}, action: "list" }),
    401
  );
  await expectStatus(
    "guest reports",
    await post("/api/mobile/reports", {
      identity: {},
      reportId: `${runId}_guest_report`,
      reportedUserId: "nobody",
      reportedUserName: "Nobody",
      reason: "other",
      reasonLabel: "Other"
    }),
    401
  );
  await expectStatus("guest account delete", await del("/api/mobile/account", { identity: {} }), 401);
}

async function assertLiveFlow() {
  const [a, b, d] = await Promise.all([
    createLiveUser("a"),
    createLiveUser("b"),
    createLiveUser("d")
  ]);

  const matches = await post("/api/mobile/matches", { identity: a.identity });
  await expectStatus("list live matches", matches, 200);
  assert(
    matches.payload.matches?.some((match) => match.remoteUserId === b.id),
    "Live matches did not include the seeded user B"
  );

  const aLikesB = await post("/api/mobile/likes", {
    identity: a.identity,
    candidate: b.candidate
  });
  await expectStatus("A likes B", aLikesB, 200);
  assert(aLikesB.payload.status === "pending", `A like expected pending, got ${aLikesB.payload.status}`);

  await expectStatus(
    "one-sided chat",
    await post("/api/mobile/chats/thread", {
      identity: a.identity,
      candidate: b.candidate
    }),
    403
  );

  const bLikesA = await post("/api/mobile/likes", {
    identity: b.identity,
    candidate: a.candidate
  });
  await expectStatus("B likes A", bLikesA, 200);
  assert(bLikesA.payload.status === "matched", `B like expected matched, got ${bLikesA.payload.status}`);

  const aMessage = `hello ${runId}`;
  const aSend = await post("/api/mobile/chats/thread", {
    identity: a.identity,
    candidate: b.candidate,
    message: aMessage
  });
  await expectStatus("A sends message", aSend, 200);
  assert(
    aSend.payload.messages?.some((message) => message.text === aMessage),
    "A message was not returned from chat endpoint"
  );

  const bFetch = await post("/api/mobile/chats/thread", {
    identity: b.identity,
    candidate: a.candidate
  });
  await expectStatus("B fetches message", bFetch, 200);
  assert(
    bFetch.payload.messages?.some((message) => message.text === aMessage),
    "B could not reload A's message"
  );

  const reportId = `${runId}_a_reports_b`;
  createdReportIds.add(reportId);
  const report = await post("/api/mobile/reports", {
    identity: a.identity,
    reportId,
    reporterEmail: a.email,
    reportedUserId: b.id,
    reportedUserName: b.name,
    reason: "other",
    reasonLabel: "Other",
    details: "Production smoke report.",
    createdAt: new Date().toISOString(),
    appBuild: "prod-smoke",
    appVersion: "prod-smoke"
  });
  await expectStatus("submit report", report, 200);
  assert(report.payload.stored === true, "Report response did not confirm database storage");

  await expectStatus(
    "A blocks B",
    await post("/api/mobile/blocks", {
      identity: a.identity,
      action: "block",
      candidate: b.candidate
    }),
    200
  );
  await expectStatus(
    "B cannot message after block",
    await post("/api/mobile/chats/thread", {
      identity: b.identity,
      candidate: a.candidate,
      message: `blocked ${runId}`
    }),
    403
  );

  const dFiledReportId = `${runId}_d_filed`;
  const dReportedReportId = `${runId}_d_reported`;
  createdReportIds.add(dFiledReportId);
  createdReportIds.add(dReportedReportId);
  await expectStatus(
    "D files report",
    await post("/api/mobile/reports", {
      identity: d.identity,
      reportId: dFiledReportId,
      reportedUserId: a.id,
      reportedUserName: a.name,
      reason: "other",
      reasonLabel: "Other",
      details: "This detail should be anonymized on D deletion.",
      createdAt: new Date().toISOString()
    }),
    200
  );
  await expectStatus(
    "A reports D",
    await post("/api/mobile/reports", {
      identity: a.identity,
      reportId: dReportedReportId,
      reportedUserId: d.id,
      reportedUserName: d.name,
      reason: "other",
      reasonLabel: "Other",
      details: "Report about D.",
      createdAt: new Date().toISOString()
    }),
    200
  );

  await expectStatus("delete D account", await del("/api/mobile/account", { identity: d.identity }), 200);
  assert((await prisma.user.findUnique({ where: { id: d.id } })) === null, "Deleted account user still exists");
  assert((await prisma.account.count({ where: { userId: d.id } })) === 0, "Deleted account still has Account rows");
  assert((await prisma.session.count({ where: { userId: d.id } })) === 0, "Deleted account still has Session rows");
  assert((await prisma.proxy.count({ where: { userId: d.id } })) === 0, "Deleted account still has Profile row");

  const dFiled = await prisma.safetyReport.findUnique({ where: { id: dFiledReportId } });
  const dReported = await prisma.safetyReport.findUnique({ where: { id: dReportedReportId } });
  assert(dFiled?.reporterId === "deleted_mobile_account", "Filed report was not anonymized to deleted reporter");
  assert(dFiled?.details === null, "Filed report free text was not anonymized");
  assert(dReported?.reportedUserId === null, "Report about deleted user still has reported user id");
  assert(dReported?.reportedUserName === "Deleted account", "Report about deleted user was not anonymized");
}

async function cleanup() {
  await prisma.safetyReport.deleteMany({
    where: { id: { in: [...createdReportIds] } }
  });
  await prisma.user.deleteMany({
    where: { id: { in: [...createdUserIds] } }
  });
}

try {
  await assertMigrationsAndTables();
  await assertUnauthenticatedRoutes();
  await assertLiveFlow();
  console.log(`Production DB smoke checks passed for ${baseUrl}`);
} finally {
  await cleanup().catch((error) => {
    console.error(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  });
  await prisma.$disconnect();
}
