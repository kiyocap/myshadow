import { getPrisma } from "@/lib/prisma";

const DELETED_ACCOUNT_USER_ID = "deleted_mobile_account";

export async function deleteMobileAccount(userId: string) {
  const db = getPrisma();

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return { deleted: true, alreadyDeleted: true };
    }

    const deletedReporter = await tx.user.upsert({
      where: { id: DELETED_ACCOUNT_USER_ID },
      create: {
        id: DELETED_ACCOUNT_USER_ID,
        name: "Deleted account"
      },
      update: {
        name: "Deleted account",
        email: null,
        image: null
      }
    });

    const reportsFiled = await tx.safetyReport.updateMany({
      where: { reporterId: user.id },
      data: {
        reporterId: deletedReporter.id,
        details: null,
        threadId: null,
        messageId: null
      }
    });

    const reportsAbout = await tx.safetyReport.updateMany({
      where: { reportedUserId: user.id },
      data: {
        reportedUserId: null,
        reportedUserName: "Deleted account",
        threadId: null,
        messageId: null
      }
    });

    const sessions = await tx.session.deleteMany({ where: { userId: user.id } });
    const accounts = await tx.account.deleteMany({ where: { userId: user.id } });
    const profile = await tx.proxy.deleteMany({ where: { userId: user.id } });
    const likes = await tx.matchLike.deleteMany({
      where: { OR: [{ likerId: user.id }, { likedId: user.id }] }
    });
    const blocks = await tx.userBlock.deleteMany({
      where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] }
    });
    const messages = await tx.chatMessage.deleteMany({ where: { senderId: user.id } });
    const threads = await tx.chatThread.deleteMany({
      where: { OR: [{ participantAId: user.id }, { participantBId: user.id }] }
    });

    await tx.user.delete({ where: { id: user.id } });

    return {
      deleted: true,
      anonymizedSafetyReports: reportsFiled.count + reportsAbout.count,
      removed: {
        sessions: sessions.count,
        accounts: accounts.count,
        profiles: profile.count,
        likes: likes.count,
        blocks: blocks.count,
        chatMessages: messages.count,
        chatThreads: threads.count
      }
    };
  });
}
