import type { AIMeetingResult } from "@/lib/ai";

type StoredMeeting = {
  meeting: AIMeetingResult;
  savedAt: number;
};

type MeetingStoreGlobal = typeof globalThis & {
  __proxyMeetingStore?: Map<string, StoredMeeting>;
};

const MAX_MEETINGS = 50;
const MEETING_TTL_MS = 1000 * 60 * 60 * 12;

function getMeetingStore() {
  const globalStore = globalThis as MeetingStoreGlobal;

  if (!globalStore.__proxyMeetingStore) {
    globalStore.__proxyMeetingStore = new Map();
  }

  return globalStore.__proxyMeetingStore;
}

function pruneMeetingStore() {
  const store = getMeetingStore();
  const now = Date.now();

  for (const [id, stored] of store.entries()) {
    if (now - stored.savedAt > MEETING_TTL_MS) {
      store.delete(id);
    }
  }

  while (store.size > MAX_MEETINGS) {
    const oldestId = store.keys().next().value;

    if (!oldestId) return;

    store.delete(oldestId);
  }
}

export function saveMeeting(meeting: AIMeetingResult) {
  const store = getMeetingStore();

  store.set(meeting.id, {
    meeting,
    savedAt: Date.now()
  });

  pruneMeetingStore();

  return meeting;
}

export function getStoredMeeting(id: string) {
  pruneMeetingStore();

  return getMeetingStore().get(id)?.meeting ?? null;
}
