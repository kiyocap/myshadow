import {
  createHash,
  createPublicKey,
  randomBytes,
  type JsonWebKey,
  verify as verifySignature
} from "crypto";

import { getPrisma } from "@/lib/prisma";

export interface MobileAuthIdentity {
  userKey?: string | null;
  inviteCode?: string | null;
  email?: string | null;
  displayName?: string | null;
  mobileSessionToken?: string | null;
  appleUserId?: string | null;
}

export interface AppleMobileSessionInput {
  identityToken: string;
  appleUserId?: string | null;
  email?: string | null;
  displayName?: string | null;
}

interface AppleKey {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  n: string;
  e: string;
}

interface AppleClaims {
  iss: string;
  aud: string | string[];
  exp: number;
  iat?: number;
  sub: string;
  email?: string;
  email_verified?: string | boolean;
}

let cachedAppleKeys: { expiresAt: number; keys: AppleKey[] } | null = null;

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function userIdFromApple(appleSub: string) {
  return `ios_apple_${hash(appleSub)}`;
}

function allowedAudiences() {
  const configured =
    process.env.MOBILE_APPLE_AUDIENCE ??
    process.env.APPLE_BUNDLE_ID ??
    process.env.IOS_BUNDLE_ID ??
    "com.humanityone.shadow";
  return configured
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function decodePart<T>(part: string): T {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}

async function appleKeys() {
  const now = Date.now();
  if (cachedAppleKeys && cachedAppleKeys.expiresAt > now) {
    return cachedAppleKeys.keys;
  }

  const response = await fetch("https://appleid.apple.com/auth/keys", {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("APPLE_KEYS_UNAVAILABLE");
  }
  const payload = (await response.json()) as { keys?: AppleKey[] };
  const keys = payload.keys ?? [];
  cachedAppleKeys = { keys, expiresAt: now + 60 * 60 * 1000 };
  return keys;
}

export async function verifyAppleIdentityToken(identityToken: string) {
  const parts = identityToken.split(".");
  if (parts.length !== 3) {
    throw new Error("APPLE_TOKEN_INVALID");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodePart<{ kid?: string; alg?: string }>(encodedHeader);
  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("APPLE_TOKEN_INVALID");
  }

  const key = (await appleKeys()).find((candidate) => candidate.kid === header.kid);
  if (!key) {
    throw new Error("APPLE_TOKEN_INVALID");
  }

  const publicKey = createPublicKey({ key: key as unknown as JsonWebKey, format: "jwk" });
  const signed = Buffer.from(`${encodedHeader}.${encodedPayload}`);
  const signature = Buffer.from(encodedSignature, "base64url");
  const valid = verifySignature("RSA-SHA256", signed, publicKey, signature);
  if (!valid) {
    throw new Error("APPLE_TOKEN_INVALID");
  }

  const claims = decodePart<AppleClaims>(encodedPayload);
  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const allowed = allowedAudiences();

  if (claims.iss !== "https://appleid.apple.com") {
    throw new Error("APPLE_TOKEN_INVALID");
  }
  if (!audiences.some((audience) => allowed.includes(audience))) {
    throw new Error("APPLE_TOKEN_AUDIENCE");
  }
  if (claims.exp <= now) {
    throw new Error("APPLE_TOKEN_EXPIRED");
  }
  if (!claims.sub) {
    throw new Error("APPLE_TOKEN_INVALID");
  }

  return claims;
}

async function upsertAppleUser(claims: AppleClaims, displayName?: string | null) {
  const db = getPrisma();
  const appleSub = claims.sub;
  const email = clean(claims.email)?.toLowerCase() ?? null;
  const name = clean(displayName) ?? (email ? email.split("@")[0] : "Shadow user");

  const existingAccount = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "apple",
        providerAccountId: appleSub
      }
    },
    include: { user: true }
  });

  if (existingAccount) {
    return db.user.update({
      where: { id: existingAccount.userId },
      data: {
        email: existingAccount.user.email ?? email ?? undefined,
        name: name ?? undefined
      }
    });
  }

  const user = email
    ? await db.user.upsert({
        where: { email },
        create: { id: userIdFromApple(appleSub), email, name },
        update: { name }
      })
    : await db.user.upsert({
        where: { id: userIdFromApple(appleSub) },
        create: { id: userIdFromApple(appleSub), name },
        update: { name }
      });

  await db.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "apple",
        providerAccountId: appleSub
      }
    },
    create: {
      userId: user.id,
      type: "oauth",
      provider: "apple",
      providerAccountId: appleSub
    },
    update: { userId: user.id }
  });

  return user;
}

export async function createAppleMobileSession(input: AppleMobileSessionInput) {
  const claims = await verifyAppleIdentityToken(input.identityToken);
  if (input.appleUserId && input.appleUserId !== claims.sub) {
    throw new Error("APPLE_TOKEN_INVALID");
  }

  const db = getPrisma();
  const user = await upsertAppleUser(
    { ...claims, email: claims.email ?? clean(input.email) ?? undefined },
    input.displayName
  );
  const sessionToken = `mobile_${randomBytes(32).toString("hex")}`;
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires
    }
  });

  return {
    userId: user.id,
    appleUserId: claims.sub,
    sessionToken,
    expiresAt: expires.toISOString(),
    email: user.email,
    displayName: user.name
  };
}

export async function requireLiveMobileUser(identity: MobileAuthIdentity) {
  const db = getPrisma();
  const token = clean(identity.mobileSessionToken);

  if (token) {
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: { user: true }
    });

    if (!session) {
      throw new Error("LIVE_AUTH_REQUIRED");
    }
    if (session.expires <= new Date()) {
      await db.session.delete({ where: { sessionToken: token } }).catch(() => null);
      throw new Error("LIVE_AUTH_EXPIRED");
    }
    return session.user;
  }

  throw new Error("LIVE_AUTH_REQUIRED");
}
