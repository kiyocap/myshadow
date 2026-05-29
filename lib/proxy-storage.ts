import type {
  CompatibilityReportData,
  GeneratedProxyProfile,
  MeetingTranscriptMessage
} from "@/lib/ai";

export const LOCAL_PROXY_PROFILE_KEY = "shadow.localProfile.v1";
export const LOCAL_LATEST_MEETING_KEY = "shadow.latestMeeting.v1";
export const LEGACY_LOCAL_PROXY_PROFILE_KEY = "proxy.localProfile.v1";
export const LEGACY_LOCAL_LATEST_MEETING_KEY = "proxy.latestMeeting.v1";

export type LocalProxyProfile = {
  name: string;
  age?: number;
  occupation?: string;
  location?: string;
  starSign?: string;
  myersBriggs?: string;
  profile: GeneratedProxyProfile;
  guidedAnswers: Record<string, string[]>;
  selectedSignalCount: number;
  importWordCount: number;
  source: "openai" | "demo";
  updatedAt: string;
};

export type LocalMeetingSnapshot = {
  id: string;
  source: "openai" | "demo";
  participants: {
    proxyAName: string;
    proxyBName: string;
  };
  report: CompatibilityReportData;
  transcriptPreview: MeetingTranscriptMessage[];
  updatedAt: string;
};
