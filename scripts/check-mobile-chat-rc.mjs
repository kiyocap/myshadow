import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.SHADOW_BASE_URL ?? "http://localhost:3000";
const databaseUrl = process.env.SHADOW_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Set SHADOW_DATABASE_URL or DATABASE_URL before running mobile chat RC checks.");
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } }
});

const runId = `rc_${Date.now()}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

async function createLiveUser(label) {
  const id = `ios_apple_${runId}_${label}`;
  const appleUserId = `${runId}.${label}.apple`;
  const email = `${runId}.${label}@example.com`;
  const name = `RC ${label.toUpperCase()}`;
  const sessionToken = `mobile_${runId}_${label}`;
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

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
    create: { sessionToken, userId: id, expires },
    update: { userId: id, expires }
  });

  return {
    id,
    appleUserId,
    email,
    name,
    identity: {
      mobileSessionToken: sessionToken,
      appleUserId,
      email,
      displayName: name
    },
    candidate: {
      userId: id,
      name,
      occupation: "RC tester",
      location: "London",
      sharedResonance: "Release candidate test",
      trait: "Careful"
    }
  };
}

try {
  const [a, b, c] = await Promise.all([
    createLiveUser("a"),
    createLiveUser("b"),
    createLiveUser("c")
  ]);

  const guestSend = await post("/api/mobile/chats/thread", {
    identity: { email: `${runId}.guest@example.com`, displayName: "Guest" },
    candidate: b.candidate,
    message: "guest should not send"
  });
  assert(guestSend.status === 401, `guest send expected 401, got ${guestSend.status}`);

  const guestLike = await post("/api/mobile/likes", {
    identity: { email: `${runId}.guest@example.com`, displayName: "Guest" },
    candidate: b.candidate
  });
  assert(guestLike.status === 401, `guest like expected 401, got ${guestLike.status}`);

  const aLikesB = await post("/api/mobile/likes", {
    identity: a.identity,
    candidate: b.candidate
  });
  assert(aLikesB.status === 200, `A like expected 200, got ${aLikesB.status}`);
  assert(aLikesB.payload.status === "pending", `A like expected pending, got ${aLikesB.payload.status}`);

  const oneSidedThread = await post("/api/mobile/chats/thread", {
    identity: a.identity,
    candidate: b.candidate
  });
  assert(oneSidedThread.status === 403, `one-sided thread expected 403, got ${oneSidedThread.status}`);

  const bLikesA = await post("/api/mobile/likes", {
    identity: b.identity,
    candidate: a.candidate
  });
  assert(bLikesA.status === 200, `B like expected 200, got ${bLikesA.status}`);
  assert(bLikesA.payload.status === "matched", `B like expected matched, got ${bLikesA.payload.status}`);

  const aMessage = `hello from A ${runId}`;
  const aSend = await post("/api/mobile/chats/thread", {
    identity: a.identity,
    candidate: b.candidate,
    message: aMessage
  });
  assert(aSend.status === 200, `A send expected 200, got ${aSend.status}`);
  assert(
    aSend.payload.messages.some((message) => message.sender === "me" && message.text === aMessage),
    "A did not see their sent message"
  );

  const bFetch = await post("/api/mobile/chats/thread", {
    identity: b.identity,
    candidate: a.candidate
  });
  assert(bFetch.status === 200, `B fetch expected 200, got ${bFetch.status}`);
  assert(
    bFetch.payload.messages.some((message) => message.sender === "them" && message.text === aMessage),
    "B did not see A's message"
  );

  const bMessage = `reply from B ${runId}`;
  const bSend = await post("/api/mobile/chats/thread", {
    identity: b.identity,
    candidate: a.candidate,
    message: bMessage
  });
  assert(bSend.status === 200, `B send expected 200, got ${bSend.status}`);

  const aFetch = await post("/api/mobile/chats/thread", {
    identity: a.identity,
    candidate: b.candidate
  });
  assert(aFetch.status === 200, `A refetch expected 200, got ${aFetch.status}`);
  assert(
    aFetch.payload.messages.some((message) => message.sender === "them" && message.text === bMessage),
    "A did not see B's reply after reload"
  );

  const cFetch = await post("/api/mobile/chats/thread", {
    identity: c.identity,
    candidate: a.candidate
  });
  assert(cFetch.status === 403, `non-participant expected 403, got ${cFetch.status}`);

  console.log("Mobile chat RC check passed", {
    baseUrl,
    users: [a.id, b.id, c.id],
    threadId: aFetch.payload.id
  });
} finally {
  await prisma.$disconnect();
}
