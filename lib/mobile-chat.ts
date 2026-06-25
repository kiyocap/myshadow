import { createHash } from "crypto";

import {
  requireLiveMobileUser,
  type MobileAuthIdentity
} from "@/lib/mobile-auth";
import { getPrisma } from "@/lib/prisma";

export interface MobileChatIdentity extends MobileAuthIdentity {}

export interface MobileChatCandidate {
  userId?: string | null;
  inviteCode?: string | null;
  email?: string | null;
  candidateId?: string | null;
  name: string;
  occupation?: string | null;
  location?: string | null;
  sharedResonance?: string | null;
  trait?: string | null;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function normalizeInviteCode(inviteCode: string) {
  const normalized = inviteCode.replace(/[^a-z0-9-]/gi, "").toUpperCase();
  return normalized.startsWith("PX-") ? normalized : `PX-${normalized.slice(-8)}`;
}

function userIdFromInvite(inviteCode: string) {
  return `ios_${normalizeInviteCode(inviteCode).replace(/[^A-Z0-9]/g, "_").toLowerCase()}`;
}

function userIdFromEmail(email: string) {
  return `ios_email_${hash(email.trim().toLowerCase())}`;
}

function userIdFromKey(key: string) {
  return `ios_key_${hash(key.trim().toLowerCase())}`;
}

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("__");
}

async function assertMutualMatch(userId: string, otherId: string) {
  const db = getPrisma();
  const [mine, theirs] = await Promise.all([
    db.matchLike.findUnique({
      where: {
        likerId_likedId: {
          likerId: userId,
          likedId: otherId
        }
      }
    }),
    db.matchLike.findUnique({
      where: {
        likerId_likedId: {
          likerId: otherId,
          likedId: userId
        }
      }
    })
  ]);

  if (!mine || !theirs) {
    throw new Error("CHAT_REQUIRES_MUTUAL_MATCH");
  }
}

export async function assertMobileUsersNotBlocked(userId: string, otherId: string) {
  const db = getPrisma();
  const block = await db.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherId },
        { blockerId: otherId, blockedId: userId }
      ]
    }
  });

  if (block) {
    throw new Error("CHAT_BLOCKED");
  }
}

export async function upsertMobileUser(identity: MobileChatIdentity) {
  const db = getPrisma();
  const email = clean(identity.email)?.toLowerCase() ?? null;
  const inviteCode = clean(identity.inviteCode);
  const userKey = clean(identity.userKey);
  const name = clean(identity.displayName);

  if (email) {
    return db.user.upsert({
      where: { email },
      create: {
        id: inviteCode ? userIdFromInvite(inviteCode) : userIdFromEmail(email),
        email,
        name: name ?? email.split("@")[0]
      },
      update: {
        name: name ?? undefined
      }
    });
  }

  if (inviteCode) {
    const id = userIdFromInvite(inviteCode);
    return db.user.upsert({
      where: { id },
      create: { id, name: name ?? "Shadow user" },
      update: { name: name ?? undefined }
    });
  }

  if (userKey) {
    const id = userIdFromKey(userKey);
    return db.user.upsert({
      where: { id },
      create: { id, name: name ?? "Shadow user" },
      update: { name: name ?? undefined }
    });
  }

  throw new Error("MOBILE_IDENTITY_REQUIRED");
}

export async function resolveReachableCandidate(candidate: MobileChatCandidate) {
  const db = getPrisma();
  const email = clean(candidate.email)?.toLowerCase() ?? null;
  const inviteCode = clean(candidate.inviteCode);
  const userId = clean(candidate.userId);

  if (userId) {
    const existing = await db.user.findUnique({ where: { id: userId } });
    if (existing) return existing;
  }

  if (email) {
    return db.user.findUnique({ where: { email } });
  }

  if (inviteCode) {
    const id = userIdFromInvite(inviteCode);
    return db.user.findUnique({ where: { id } });
  }

  return null;
}

export async function listMobileChats(identity: MobileChatIdentity) {
  const db = getPrisma();
  const user = await requireLiveMobileUser(identity);
  const [threads, blocks] = await Promise.all([
    db.chatThread.findMany({
      where: {
        OR: [{ participantAId: user.id }, { participantBId: user.id }]
      },
      orderBy: { updatedAt: "desc" },
      include: {
        participantA: true,
        participantB: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    }),
    db.userBlock.findMany({
      where: {
        OR: [{ blockerId: user.id }, { blockedId: user.id }]
      }
    })
  ]);
  const blockedIds = new Set(
    blocks.map((block) => (block.blockerId === user.id ? block.blockedId : block.blockerId))
  );

  return {
    userId: user.id,
    threads: threads.filter((thread) => {
      const otherId = thread.participantAId === user.id ? thread.participantBId : thread.participantAId;
      return !blockedIds.has(otherId);
    }).map((thread) => {
      const other = thread.participantAId === user.id ? thread.participantB : thread.participantA;
      const last = thread.messages[0];
      return {
        id: thread.id,
        remoteUserId: other.id,
        candidateName: thread.candidateName ?? other.name ?? other.email ?? "Match",
        lastPreview: last?.body ?? "Matched. Say hello when you're ready.",
        lastMessageAt: (last?.createdAt ?? thread.updatedAt).toISOString()
      };
    })
  };
}

export async function getOrCreateMobileThread(
  identity: MobileChatIdentity,
  candidate: MobileChatCandidate
) {
  const db = getPrisma();
  const user = await requireLiveMobileUser(identity);
  const other = await resolveReachableCandidate(candidate);

  if (!other) {
    throw new Error("CANDIDATE_NOT_REACHABLE");
  }

  if (other.id === user.id) {
    throw new Error("SELF_CHAT");
  }

  await assertMobileUsersNotBlocked(user.id, other.id);
  await assertMutualMatch(user.id, other.id);

  const key = pairKey(user.id, other.id);
  const [participantAId, participantBId] = [user.id, other.id].sort();
  const thread = await db.chatThread.upsert({
    where: { pairKey: key },
    create: {
      pairKey: key,
      participantAId,
      participantBId,
      candidateName: candidate.name,
      candidateMeta: {
        candidateId: clean(candidate.candidateId),
        occupation: clean(candidate.occupation),
        location: clean(candidate.location),
        sharedResonance: clean(candidate.sharedResonance),
        trait: clean(candidate.trait)
      }
    },
    update: {
      candidateName: candidate.name,
      candidateMeta: {
        candidateId: clean(candidate.candidateId),
        occupation: clean(candidate.occupation),
        location: clean(candidate.location),
        sharedResonance: clean(candidate.sharedResonance),
        trait: clean(candidate.trait)
      }
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } }
    }
  });

  return { user, other, thread };
}

export async function getMobileThread(
  identity: MobileChatIdentity,
  candidate: MobileChatCandidate
) {
  const { user, other, thread } = await getOrCreateMobileThread(identity, candidate);
  return threadResponse(user.id, other.id, thread);
}

export async function sendMobileMessage(
  identity: MobileChatIdentity,
  candidate: MobileChatCandidate,
  text: string
) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("EMPTY_MESSAGE");
  }

  const db = getPrisma();
  const { user, other, thread } = await getOrCreateMobileThread(identity, candidate);
  await db.chatMessage.create({
    data: {
      threadId: thread.id,
      senderId: user.id,
      body: trimmed
    }
  });

  const refreshed = await db.chatThread.findUniqueOrThrow({
    where: { id: thread.id },
    include: { messages: { orderBy: { createdAt: "asc" } } }
  });

  return threadResponse(user.id, other.id, refreshed);
}

function threadResponse(
  viewerId: string,
  remoteUserId: string,
  thread: {
    id: string;
    candidateName: string | null;
    messages: Array<{ id: string; senderId: string; body: string; createdAt: Date }>;
  }
) {
  return {
    id: thread.id,
    remoteUserId,
    candidateName: thread.candidateName ?? "Match",
    messages: thread.messages.map((message) => ({
      id: message.id,
      sender: message.senderId === viewerId ? "me" : "them",
      text: message.body,
      timestamp: message.createdAt.toISOString()
    }))
  };
}
