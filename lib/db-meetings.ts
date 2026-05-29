import { MeetingStatus, MeetingTopic } from "@prisma/client";

import {
  demoAIMeeting,
  generateAIMeeting,
  type AIMeetingResult,
  type MeetingTranscriptMessage,
  type CompatibilityReportData
} from "@/lib/ai";
import { databaseReady, proxyToRepresentative } from "@/lib/db-shadow";
import { saveMeeting } from "@/lib/meeting-store";
import { getPrisma } from "@/lib/prisma";

const topicToEnum: Record<string, MeetingTopic> = {
  Identity: MeetingTopic.IDENTITY,
  Values: MeetingTopic.VALUES,
  Lifestyle: MeetingTopic.LIFESTYLE,
  Money: MeetingTopic.MONEY,
  Family: MeetingTopic.FAMILY,
  Communication: MeetingTopic.COMMUNICATION,
  Conflict: MeetingTopic.CONFLICT,
  Ambition: MeetingTopic.AMBITION,
  "Long-Term Goals": MeetingTopic.LONG_TERM_GOALS
};

const enumToTopic: Record<MeetingTopic, MeetingTranscriptMessage["topic"]> = {
  IDENTITY: "Identity",
  VALUES: "Values",
  LIFESTYLE: "Lifestyle",
  MONEY: "Money",
  FAMILY: "Family",
  COMMUNICATION: "Communication",
  CONFLICT: "Conflict",
  AMBITION: "Ambition",
  LONG_TERM_GOALS: "Long-Term Goals"
};

export function inviteCodeForUser(userId: string) {
  const normalized = userId.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `PX-${normalized.slice(-8)}`;
}

export async function acceptInviteForUser(inviteCode: string, userId: string) {
  const db = getPrisma();
  const proxy = await db.proxy.findUnique({ where: { userId } });

  if (!proxy) {
    throw new Error("SHADOW_REQUIRED");
  }

  const meeting = await db.meeting.upsert({
    where: { inviteCode },
    create: { inviteCode },
    update: {},
    include: { participants: true }
  });

  const alreadyJoined = meeting.participants.some(
    (participant) => participant.proxyId === proxy.id
  );

  if (!alreadyJoined && meeting.participants.length >= 2) {
    throw new Error("INVITE_FULL");
  }

  if (!alreadyJoined && meeting.participants.length < 2) {
    await db.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        proxyId: proxy.id,
        role: meeting.participants.length === 0 ? "A" : "B"
      }
    });
  }

  const participantCount = await db.meetingParticipant.count({
    where: { meetingId: meeting.id }
  });

  return { meetingId: meeting.id, participantCount, alreadyJoined };
}

export async function ensureInviteForUser(inviteCode: string, userId: string) {
  if (!databaseReady()) {
    return null;
  }

  const db = getPrisma();
  const proxy = await db.proxy.findUnique({ where: { userId } });

  if (!proxy) {
    const existingMeeting = await db.meeting.findUnique({
      where: { inviteCode },
      include: {
        participants: {
          orderBy: { role: "asc" },
          include: { proxy: true }
        }
      }
    });

    return existingMeeting
      ? meetingStateFromRecord(existingMeeting)
      : {
          inviteCode,
          meetingId: null,
          participantCount: 0,
          isReady: false,
          participants: [] as string[],
          needsShadow: true
        };
  }

  const joined = await acceptInviteForUser(inviteCode, userId);
  const meeting = await db.meeting.findUnique({
    where: { id: joined.meetingId },
    include: {
      participants: {
        orderBy: { role: "asc" },
        include: { proxy: true }
      }
    }
  });

  return meeting ? meetingStateFromRecord(meeting) : null;
}

export async function getMeetingReadiness(meetingId: string) {
  if (!databaseReady()) {
    return null;
  }

  const db = getPrisma();
  const meeting = await db.meeting.findUnique({
    where: { id: meetingId },
    include: {
      participants: {
        orderBy: { role: "asc" },
        include: { proxy: true }
      }
    }
  });

  return meeting ? meetingStateFromRecord(meeting) : null;
}

function meetingStateFromRecord(meeting: {
  id: string;
  inviteCode: string;
  participants: Array<{ proxy: { displayName: string } }>;
}) {
  const participants = meeting.participants.map(
    (participant) => participant.proxy.displayName
  );

  return {
    inviteCode: meeting.inviteCode,
    meetingId: meeting.id,
    participantCount: participants.length,
    isReady: participants.length >= 2,
    participants,
    needsShadow: false
  };
}

async function saveGeneratedMeeting(meeting: AIMeetingResult) {
  const db = getPrisma();
  await db.meeting.update({
    where: { id: meeting.id },
    data: {
      status: MeetingStatus.COMPLETED,
      currentTopic: topicToEnum[meeting.currentTopic],
      completedAt: new Date(),
      messages: {
        deleteMany: {},
        create: meeting.transcript.map((message) => ({
          speakerName: message.speakerName,
          topic: topicToEnum[message.topic],
          content: message.content,
          turn: message.turn
        }))
      },
      report: {
        upsert: {
          create: reportToDb(meeting.report),
          update: reportToDb(meeting.report)
        }
      }
    }
  });
}

function reportToDb(report: CompatibilityReportData) {
  return {
    overallScore: report.overallScore,
    communication: report.communication,
    lifestyle: report.lifestyle,
    values: report.values,
    ambition: report.ambition,
    conflictResolution: report.conflictResolution,
    greenFlags: report.greenFlags,
    potentialFriction: report.potentialFriction,
    questionsToDiscuss: report.questionsToDiscuss,
    suggestedFirstDate: report.suggestedFirstDate,
    suggestedFirstDates: report.suggestedFirstDates,
    relationshipOutlook: report.relationshipOutlook,
    shareCardText: report.shareCardText
  };
}

export async function generateDbMeeting(meetingId: string) {
  if (!databaseReady()) {
    return null;
  }

  const db = getPrisma();
  const meeting = await db.meeting.findUnique({
    where: { id: meetingId },
    include: {
      participants: {
        orderBy: { role: "asc" },
        include: { proxy: true }
      },
      report: true,
      messages: { orderBy: { turn: "asc" } }
    }
  });

  if (!meeting || meeting.participants.length < 2) {
    return null;
  }

  const [proxyA, proxyB] = meeting.participants.map((participant) =>
    proxyToRepresentative(participant.proxy)
  );

  if (meeting.report && meeting.messages.length > 0) {
    const result: AIMeetingResult = {
      id: meeting.id,
      status: "COMPLETED",
      currentTopic: enumToTopic[meeting.currentTopic],
      participants: { proxyA, proxyB },
      transcript: meeting.messages.map((message) => ({
        speakerName: message.speakerName,
        topic: enumToTopic[message.topic],
        content: message.content,
        turn: message.turn
      })),
      report: {
        overallScore: meeting.report.overallScore,
        communication: meeting.report.communication,
        lifestyle: meeting.report.lifestyle,
        values: meeting.report.values,
        ambition: meeting.report.ambition,
        conflictResolution: meeting.report.conflictResolution,
        greenFlags: meeting.report.greenFlags as string[],
        potentialFriction: meeting.report.potentialFriction as string[],
        questionsToDiscuss: meeting.report.questionsToDiscuss as string[],
        suggestedFirstDate: meeting.report.suggestedFirstDate,
        suggestedFirstDates: meeting.report.suggestedFirstDates as CompatibilityReportData["suggestedFirstDates"],
        relationshipOutlook: meeting.report.relationshipOutlook,
        shareCardText: meeting.report.shareCardText
      },
      source: "openai"
    };

    return saveMeeting(result);
  }

  const generated = await generateAIMeeting({
    meetingId: meeting.id,
    proxyA,
    proxyB
  }).catch(() => demoAIMeeting(meeting.id, proxyA, proxyB));

  await saveGeneratedMeeting(generated);

  return saveMeeting(generated);
}
