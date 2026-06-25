import { requireLiveMobileUser, type MobileAuthIdentity } from "@/lib/mobile-auth";
import {
  resolveReachableCandidate,
  type MobileChatCandidate
} from "@/lib/mobile-chat";
import { getPrisma } from "@/lib/prisma";

export async function listMobileBlocks(identity: MobileAuthIdentity) {
  const db = getPrisma();
  const user = await requireLiveMobileUser(identity);
  const blocks = await db.userBlock.findMany({
    where: { blockerId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return {
    userId: user.id,
    blockedUserIds: blocks.map((block) => block.blockedId)
  };
}

export async function blockMobileUser(
  identity: MobileAuthIdentity,
  candidate: MobileChatCandidate
) {
  const db = getPrisma();
  const user = await requireLiveMobileUser(identity);
  const other = await resolveReachableCandidate(candidate);

  if (!other) {
    throw new Error("CANDIDATE_NOT_REACHABLE");
  }
  if (other.id === user.id) {
    throw new Error("SELF_BLOCK");
  }

  await db.userBlock.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: user.id,
        blockedId: other.id
      }
    },
    create: {
      blockerId: user.id,
      blockedId: other.id
    },
    update: {}
  });

  return listMobileBlocks(identity);
}

export async function unblockMobileUser(
  identity: MobileAuthIdentity,
  candidate: MobileChatCandidate
) {
  const db = getPrisma();
  const user = await requireLiveMobileUser(identity);
  const other = await resolveReachableCandidate(candidate);

  if (!other) {
    throw new Error("CANDIDATE_NOT_REACHABLE");
  }
  if (other.id === user.id) {
    throw new Error("SELF_BLOCK");
  }

  await db.userBlock.deleteMany({
    where: {
      blockerId: user.id,
      blockedId: other.id
    }
  });

  return listMobileBlocks(identity);
}
