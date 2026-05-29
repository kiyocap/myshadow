"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Download, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CompatibilityReportData } from "@/lib/ai";

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function wrapText(value: string, maxLineLength: number) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;

    if (next.length > maxLineLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines.slice(0, 5);
}

const shareColors = [
  { label: "Black", background: "#050505", accent: "#2563eb", secondary: "#8b5cf6" },
  { label: "Blue", background: "#06111f", accent: "#2563eb", secondary: "#06b6d4" },
  { label: "Cyan", background: "#041315", accent: "#06b6d4", secondary: "#2563eb" },
  { label: "Rose", background: "#17070d", accent: "#f43f5e", secondary: "#2563eb" },
  { label: "White", background: "#ffffff", accent: "#2563eb", secondary: "#8b5cf6" }
] as const;

type ShareColor = (typeof shareColors)[number];

function makeShareCardSvg(report: CompatibilityReportData, color: ShareColor) {
  const outlook = report.shareCardText
    .replace(/^Your AIs are \d+% compatible\.\s*/i, "")
    .trim() || "Strong potential for a meaningful connection.";
  const lines = wrapText(outlook, 34);
  const textColor = color.background === "#ffffff" ? "#050505" : "#ffffff";
  const mutedTextColor = color.background === "#ffffff" ? "0.62" : "0.66";
  const logoOpacity = color.background === "#ffffff" ? "0.72" : "0.7";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <rect width="1200" height="1500" fill="${color.background}"/>
  <circle cx="865" cy="390" r="126" fill="none" stroke="${color.accent}" stroke-opacity="0.34" stroke-width="2"/>
  <circle cx="865" cy="390" r="70" fill="${color.accent}" fill-opacity="0.18"/>
  <circle cx="865" cy="390" r="32" fill="${color.accent}"/>
  <circle cx="760" cy="980" r="116" fill="none" stroke="${color.secondary}" stroke-opacity="0.34" stroke-width="2"/>
  <circle cx="760" cy="980" r="30" fill="${color.secondary}"/>
  <path d="M775 950 C835 845 860 690 870 420" fill="none" stroke="${color.accent}" stroke-opacity="0.32" stroke-width="3"/>
  <text x="96" y="136" fill="${textColor}" fill-opacity="0.72" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="42">Our AIs are</text>
  <text x="96" y="340" fill="${textColor}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="176" font-weight="700">${report.overallScore}%</text>
  <text x="96" y="446" fill="${textColor}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="72" font-weight="700">compatible.</text>
  ${lines
    .map(
      (line, index) =>
        `<text x="96" y="${650 + index * 52}" fill="${textColor}" fill-opacity="${mutedTextColor}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="36">${escapeSvgText(line)}</text>`
    )
    .join("")}
  <circle cx="116" cy="1348" r="24" fill="none" stroke="${textColor}" stroke-opacity="${logoOpacity}" stroke-width="3"/>
  <circle cx="142" cy="1354" r="8" fill="${textColor}"/>
  <text x="176" y="1362" fill="${textColor}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="34" font-weight="700">Shadow</text>
</svg>`;
}

export function ReportHeaderActions({ report }: { report: CompatibilityReportData }) {
  const [shared, setShared] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);

  async function shareReport() {
    const url = window.location.href;
    const text = `${report.shareCardText} ${url}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "What Your AIs Learned",
          text: report.shareCardText,
          url
        });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
      setShareFailed(false);
    } catch {
      setShareFailed(true);
      await navigator.clipboard.writeText(text);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="icon"
        aria-label={shared ? "Report link copied" : "Share report"}
        onClick={shareReport}
        type="button"
      >
        {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      </Button>
      {shareFailed && (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Copied link instead
        </span>
      )}
    </div>
  );
}

export function DownloadPdfButton({ className }: { className?: string }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      onClick={() => window.print()}
      type="button"
    >
      <Download className="h-4 w-4" />
      Download PDF
    </Button>
  );
}

export function ShareControls({ report }: { report: CompatibilityReportData }) {
  const [copied, setCopied] = useState<"text" | "link" | "download" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ShareColor>(shareColors[0]);
  const shareTextRef = useRef<HTMLTextAreaElement>(null);
  const shareText = useMemo(() => report.shareCardText, [report.shareCardText]);
  const shareCardDescription =
    shareText.replace(/^Your AIs are \d+% compatible\.\s*/i, "").trim() ||
    "Strong potential for a meaningful connection.";

  async function writeClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to the textarea fallback for browsers that block clipboard.
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let copiedToClipboard = false;
    try {
      copiedToClipboard = document.execCommand("copy");
    } catch {
      copiedToClipboard = false;
    } finally {
      textarea.remove();
    }

    return copiedToClipboard;
  }

  async function copy(value: "text" | "link") {
    const text = value === "text" ? shareText : window.location.href;
    const didCopy = await writeClipboard(text);

    if (!didCopy) {
      if (value === "text") {
        shareTextRef.current?.focus();
        shareTextRef.current?.select();
      }

      setActionError(
        value === "text"
          ? "Your browser blocked automatic copying, so the share text has been selected for you."
          : "Your browser blocked link copying. Copy the page URL from the address bar."
      );
      window.setTimeout(() => setActionError(null), 3200);
      return;
    }

    setActionError(null);
    setCopied(value);
    window.setTimeout(() => setCopied(null), 1800);
  }

  function triggerDownload(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  }

  async function loadImage(url: string) {
    const image = new Image();
    image.decoding = "async";
    image.src = url;

    if (image.decode) {
      try {
        await image.decode();
        return image;
      } catch {
        // Safari can reject decode for blob-backed SVGs even when onload works.
      }
    }

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image could not be prepared"));
    });

    return image;
  }

  async function downloadImage() {
    const svg = makeShareCardSvg(report, selectedColor);
    const svgUrl = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    );

    try {
      const image = await loadImage(svgUrl);
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1500;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas unavailable");
      }

      context.drawImage(image, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      triggerDownload(pngUrl, `shadow-${report.overallScore}-compatible.png`);
      setCopied("download");
      setActionError(null);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      triggerDownload(svgUrl, `shadow-${report.overallScore}-compatible.svg`);
      setCopied("download");
      setActionError("PNG was blocked by this browser, so Shadow downloaded an SVG instead.");
      window.setTimeout(() => setCopied(null), 1800);
      window.setTimeout(() => setActionError(null), 3600);
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(svgUrl), 1000);
    }
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[360px_1fr]">
      <div
        className="min-w-0 rounded-lg border p-6"
        style={{
          backgroundColor: selectedColor.background,
          borderColor:
            selectedColor.background === "#ffffff" ? "#e5e7eb" : selectedColor.background,
          color: selectedColor.background === "#ffffff" ? "#050505" : "#ffffff"
        }}
      >
        <p className="text-sm opacity-65">Our AIs are</p>
        <p className="mt-4 text-6xl font-semibold">{report.overallScore}%</p>
        <p className="text-3xl font-semibold">compatible.</p>
        <p className="mt-8 max-w-xs text-sm leading-6 opacity-65">
          {shareCardDescription}
        </p>
        <div className="mt-10 flex items-center gap-3">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-current/30">
            <span className="h-2.5 w-2.5 rounded-full border border-current" />
            <span className="absolute -right-0.5 bottom-1 h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          <span className="text-sm font-semibold">Shadow</span>
        </div>
      </div>

      <div className="max-w-sm space-y-4">
        <p className="text-sm font-medium">Customize</p>
        <div className="flex gap-2" aria-label="Share card color options">
          {shareColors.map((color) => (
            <button
              key={color.label}
              aria-label={`${color.label} share card`}
              className={
                selectedColor.label === color.label
                  ? "h-6 w-6 rounded-full border border-black ring-2 ring-blue-600 ring-offset-2"
                  : "h-6 w-6 rounded-full border border-border"
              }
              onClick={() => setSelectedColor(color)}
              style={{ backgroundColor: color.background }}
              type="button"
            />
          ))}
        </div>
        <Button className="w-full" onClick={downloadImage} type="button">
          {copied === "download" ? <Check className="h-4 w-4" /> : null}
          {copied === "download" ? "Image Downloaded" : "Download Image"}
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => copy("link")} type="button">
          {copied === "link" ? <Check className="h-4 w-4" /> : null}
          {copied === "link" ? "Copied Link" : "Copy Link"}
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => copy("text")} type="button">
          {copied === "text" ? <Check className="h-4 w-4" /> : null}
          {copied === "text" ? "Copied Text" : "Copy Share Text"}
        </Button>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Share text
          </span>
          <textarea
            ref={shareTextRef}
            className="min-h-24 w-full resize-none border border-border bg-white p-3 text-sm leading-6 text-foreground outline-none transition focus:border-blue-600"
            readOnly
            value={shareText}
          />
        </label>
        <p className="text-xs leading-5 text-muted-foreground">
          PNG is sized for sharing. Copy Link shares this report page; Copy Share
          Text copies the compatibility line.
        </p>
        <p aria-live="polite" className="min-h-5 text-xs leading-5 text-muted-foreground">
          {actionError ??
            (copied === "download"
              ? "Share image saved."
              : copied === "link"
                ? "Report link copied."
                : copied === "text"
                  ? "Share text copied."
                  : "")}
        </p>
      </div>
    </div>
  );
}
