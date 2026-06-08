import { NextResponse } from "next/server";
import { toFile } from "openai";

import { getOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024;
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL ?? "whisper-1";

const ACCEPTED_TYPES = [
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/aac",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg"
];

export async function POST(request: Request) {
  const client = getOpenAI();

  if (!client) {
    return NextResponse.json(
      { error: "Transcription is waiting for production credentials." },
      { status: 501 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with an audio file." },
      { status: 400 }
    );
  }

  const audio = form.get("audio");

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json(
      { error: "No audio file was provided." },
      { status: 400 }
    );
  }

  if (audio.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Audio file is too large. Keep recordings under 25 MB." },
      { status: 413 }
    );
  }

  const type = audio.type || "audio/m4a";
  if (audio.type && !ACCEPTED_TYPES.includes(audio.type)) {
    return NextResponse.json(
      { error: "Unsupported audio format." },
      { status: 415 }
    );
  }

  try {
    const filename = audio instanceof File ? audio.name || "voice-note" : "voice-note";
    const buffer = Buffer.from(await audio.arrayBuffer());
    const file = await toFile(buffer, filename, { type });

    const result = await client.audio.transcriptions.create({
      file,
      model: TRANSCRIBE_MODEL,
      response_format: "json"
    });

    const text = (result.text ?? "").trim();

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The voice note could not be transcribed. Please try again."
      },
      { status: 502 }
    );
  }
}
