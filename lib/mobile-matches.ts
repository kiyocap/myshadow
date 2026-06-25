import { createHash } from "crypto";

import { saveUserShadow, type SaveShadowInput } from "@/lib/db-shadow";
import { getPrisma } from "@/lib/prisma";
import {
  getOrCreateMobileThread,
  resolveReachableCandidate,
  upsertMobileUser,
  type MobileChatCandidate,
  type MobileChatIdentity
} from "@/lib/mobile-chat";

function hashNumber(value: string) {
  const hex = createHash("sha256").update(value).digest("hex").slice(0, 8);
  return parseInt(hex, 16);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function splitLocation(location: string | null) {
  const parts = location?.split("·").map((part) => part.trim()).filter(Boolean) ?? [];
  return {
    home: parts[0] ?? location ?? "London",
    work: parts[1] ?? parts[0] ?? location ?? "London"
  };
}

export async function listMobileMatches(
  identity: MobileChatIdentity,
  shadow?: SaveShadowInput
) {
  const db = getPrisma();
  const user = await upsertMobileUser(identity);

  if (shadow) {
    await saveUserShadow(user.id, shadow);
  }

  const [proxies, likesToMe, myLikes] = await Promise.all([
    db.proxy.findMany({
      where: { userId: { not: user.id } },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
      take: 50
    }),
    db.matchLike.findMany({
      where: { likedId: user.id },
      select: { likerId: true }
    }),
    db.matchLike.findMany({
      where: { likerId: user.id },
      select: { likedId: true }
    })
  ]);

  const likedMe = new Set(likesToMe.map((like) => like.likerId));
  const likedByMe = new Set(myLikes.map((like) => like.likedId));

  return {
    userId: user.id,
    matches: proxies.map((proxy) => {
      const generated = proxy.generatedProfile as Record<string, unknown>;
      const traits = asStringArray(generated.traits).slice(0, 3);
      const values = asStringArray(generated.values).slice(0, 3);
      const goals = asStringArray(generated.goals).slice(0, 2);
      const locations = splitLocation(proxy.location);
      const score = 78 + (hashNumber(`${user.id}:${proxy.userId}`) % 18);

      return {
        id: proxy.userId,
        remoteUserId: proxy.userId,
        name: proxy.displayName,
        age: proxy.age ?? 30,
        occupation: proxy.occupation ?? "Shadow member",
        industry: "Other",
        ethnicity: "Prefer not to say",
        location: locations.home,
        workLocation: locations.work,
        distanceMiles: 1 + (hashNumber(proxy.userId) % 45) / 10,
        metAt: "live",
        score,
        tag: likedMe.has(proxy.userId) ? "They said yes" : "Live Shadow",
        verdict:
          proxy.summary ||
          "A real Shadow profile from the live network. Your representative can test whether the connection has enough signal.",
        greenFlags:
          values.length > 0
            ? values.map((value) => `Values ${value.toLowerCase()} in connection`)
            : goals.length > 0
              ? goals.map((goal) => `Working toward ${goal.toLowerCase()}`)
              : ["Live account with a completed Shadow"],
        treadGently: "This is a live account, so only open chat after a mutual yes.",
        traits: traits.length > 0 ? traits : ["Thoughtful", "Curious", "Open"],
        source: "overnight",
        prelikedYou: likedMe.has(proxy.userId),
        likedByYou: likedByMe.has(proxy.userId)
      };
    })
  };
}

export async function likeMobileMatch(
  identity: MobileChatIdentity,
  candidate: MobileChatCandidate
) {
  const db = getPrisma();
  const user = await upsertMobileUser(identity);
  const other = await resolveReachableCandidate(candidate);

  if (!other) {
    throw new Error("CANDIDATE_NOT_REACHABLE");
  }

  if (other.id === user.id) {
    throw new Error("SELF_LIKE");
  }

  await db.matchLike.upsert({
    where: {
      likerId_likedId: {
        likerId: user.id,
        likedId: other.id
      }
    },
    create: {
      likerId: user.id,
      likedId: other.id
    },
    update: {}
  });

  const reciprocal = await db.matchLike.findUnique({
    where: {
      likerId_likedId: {
        likerId: other.id,
        likedId: user.id
      }
    }
  });

  if (reciprocal) {
    await getOrCreateMobileThread(identity, candidate);
  }

  return {
    status: reciprocal ? "matched" : "pending",
    remoteUserId: other.id
  };
}
