"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

const productionInviteOrigin = "https://myshadowapp.vercel.app";

export function CopyInviteButton({ invitePath }: { invitePath: string }) {
  const [copied, setCopied] = useState(false);
  const inviteLink = useMemo(
    () => `${productionInviteOrigin}${invitePath}`,
    [invitePath]
  );

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = inviteLink;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex items-center justify-between gap-3 border border-border p-4">
      <span className="min-w-0 truncate pr-2 font-mono text-sm">{inviteLink}</span>
      <Button
        variant="secondary"
        size="sm"
        aria-label={copied ? "Invite link copied" : "Copy invite link"}
        onClick={copyInvite}
        type="button"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
