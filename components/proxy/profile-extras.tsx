"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Plus, Square, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

// ─── Photos ────────────────────────────────────────────────────────────────

async function fileToResizedDataUrl(file: File, max = 900): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    const img = document.createElement("img");
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return dataUrl;
  }
}

export function PhotoUploader({
  photos,
  onChange,
  max = 3
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    const room = max - photos.length;
    const picked = Array.from(files).slice(0, room);
    const resized = await Promise.all(picked.map((f) => fileToResizedDataUrl(f)));
    onChange([...photos, ...resized].slice(0, max));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="border border-border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-claret">Photos</p>
          <p className="mt-2 font-display text-base font-light">Add up to {max} photos</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Shown only once both people agree to meet — never on a public feed.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{photos.length}/{max}</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {photos.map((src, index) => (
          <div key={index} className="relative aspect-square overflow-hidden border border-border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-paper transition hover:bg-ink"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-2 border border-dashed border-border bg-background text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">{busy ? "Adding…" : "Add"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ─── Voice note ──────────────────────────────────────────────────────────────

function formatTime(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceNoteRecorder({
  value,
  onChange
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, []);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        const reader = new FileReader();
        reader.onload = () => onChange(reader.result as string);
        reader.readAsDataURL(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone unavailable in this browser. You can skip this — it's optional.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  }

  return (
    <div className="border border-border p-5">
      <p className="eyebrow text-claret">Voice note</p>
      <p className="mt-2 font-display text-base font-light">Tell your shadow anything</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Talk freely — your story, what you want, what you&apos;ve been through, what you&apos;re
        done with. Your shadow listens and carries it into every conversation. Nobody else hears it.
      </p>

      <div className="mt-5">
        {!value && !recording && (
          <Button type="button" variant="secondary" size="sm" onClick={startRecording}>
            <Mic className="h-4 w-4" /> Start recording
          </Button>
        )}

        {recording && (
          <div className="flex items-center gap-4">
            <Button type="button" size="sm" onClick={stopRecording}>
              <Square className="h-3.5 w-3.5" /> Stop
            </Button>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-claret" />
              Recording · {formatTime(seconds)}
            </span>
          </div>
        )}

        {value && !recording && (
          <div className="space-y-3">
            <audio src={value} controls className="h-10 w-full" />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={startRecording}>
                <Mic className="h-4 w-4" /> Re-record
              </Button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-xs leading-5 text-muted-foreground">{error}</p>}
      </div>
    </div>
  );
}

// ─── Social connect ──────────────────────────────────────────────────────────

function InstagramLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function TikTokLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.2 3h2.6c.2 1.9 1.3 3.5 3.2 3.9v2.6c-1.2 0-2.4-.4-3.2-1v5.4a5.1 5.1 0 1 1-5.1-5.1c.3 0 .5 0 .8.1v2.7a2.5 2.5 0 1 0 1.7 2.3V3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type Socials = { instagram?: boolean; tiktok?: boolean };

export function SocialConnect({
  value,
  onChange
}: {
  value: Socials;
  onChange: (next: Socials) => void;
}) {
  const items: Array<{ key: keyof Socials; label: string; handle: string; logo: React.ReactNode }> = [
    { key: "instagram", label: "Instagram", handle: "Pull your vibe, interests & aesthetic", logo: <InstagramLogo /> },
    { key: "tiktok", label: "TikTok", handle: "Let your shadow learn your sense of humour", logo: <TikTokLogo /> }
  ];

  return (
    <div className="border border-border p-5">
      <p className="eyebrow text-claret">Connect socials</p>
      <p className="mt-2 font-display text-base font-light">Give your shadow more to work with</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Optional. We read signal, never post anything. Disconnect any time.
      </p>

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const connected = Boolean(value[item.key]);
          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 border border-border bg-background p-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center border border-border text-foreground">
                  {item.logo}
                </span>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.handle}</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={connected ? "secondary" : "default"}
                onClick={() => onChange({ ...value, [item.key]: !connected })}
              >
                {connected ? "Connected" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
