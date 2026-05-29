"use client";

import { useMemo, useState } from "react";
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
  const [copied, setCopied] = useState<"text" | "link" | null>(null);
  const [selectedColor, setSelectedColor] = useState<ShareColor>(shareColors[0]);
  const shareText = useMemo(() => report.shareCardText, [report.shareCardText]);

  async function copy(value: "text" | "link") {
    await navigator.clipboard.writeText(
      value === "text" ? shareText : window.location.href
    );
    setCopied(value);
    window.setTimeout(() => setCopied(null), 1800);
  }

  function downloadImage() {
    const svg = makeShareCardSvg(report, selectedColor);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shadow-${report.overallScore}-compatible.svg`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
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
        Download Image
      </Button>
      <Button variant="secondary" className="w-full" onClick={() => copy("link")} type="button">
        {copied === "link" ? <Check className="h-4 w-4" /> : null}
        {copied === "link" ? "Copied Link" : "Copy Link"}
      </Button>
      <Button variant="secondary" className="w-full" onClick={() => copy("text")} type="button">
        {copied === "text" ? <Check className="h-4 w-4" /> : null}
        {copied === "text" ? "Copied Text" : "Copy Share Text"}
      </Button>
    </div>
  );
}
