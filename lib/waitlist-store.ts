import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local, file-backed waitlist store for the pre-launch landing page.
 *
 * This is intentionally simple so the page works out of the box with no
 * external service. Every signup is persisted to data/waitlist.json (which is
 * git-ignored). It is NOT a production mailing system.
 *
 * TODO(integration): swap this for a real provider before launch. The API route
 * in app/api/waitlist/route.ts is the single integration point. Options:
 *   - Resend audiences: the project already depends on `resend`.
 *       const resend = new Resend(process.env.RESEND_API_KEY);
 *       await resend.contacts.create({ email, audienceId: process.env.RESEND_AUDIENCE_ID });
 *   - Mailchimp: POST /lists/{id}/members with status "subscribed".
 *   - ConvertKit: POST /forms/{id}/subscribe.
 *   - Prisma/Postgres: add a `Waitlist` model and persist there instead of the JSON file.
 */

export const WAITLIST_CAP = 1000;

// Cosmetic head-start so the first signups feel like they joined a real,
// filling-up list. This is a display offset only; the real stored count starts
// at 0. Not a claim about an actual backend.
const POSITION_SEED = 824;

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "waitlist.json");

export interface WaitlistEntry {
  email: string;
  createdAt: string;
}

interface WaitlistFile {
  entries: WaitlistEntry[];
}

export interface JoinResult {
  position: number;
  spotsRemaining: number;
  alreadyJoined: boolean;
}

async function readStore(): Promise<WaitlistFile> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<WaitlistFile>;
    return { entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
  } catch {
    return { entries: [] };
  }
}

async function writeStore(data: WaitlistFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function displayPosition(index: number): number {
  // index is 0-based; show 1-based plus the cosmetic seed.
  return POSITION_SEED + index + 1;
}

function spotsRemaining(count: number): number {
  return Math.max(0, WAITLIST_CAP - (POSITION_SEED + count));
}

export async function joinWaitlist(rawEmail: string): Promise<JoinResult> {
  const email = rawEmail.trim().toLowerCase();
  const store = await readStore();

  const existingIndex = store.entries.findIndex((e) => e.email === email);
  if (existingIndex !== -1) {
    return {
      position: displayPosition(existingIndex),
      spotsRemaining: spotsRemaining(store.entries.length),
      alreadyJoined: true
    };
  }

  store.entries.push({ email, createdAt: new Date().toISOString() });
  await writeStore(store);

  const index = store.entries.length - 1;
  return {
    position: displayPosition(index),
    spotsRemaining: spotsRemaining(store.entries.length),
    alreadyJoined: false
  };
}
