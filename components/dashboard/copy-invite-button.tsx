"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CopyInviteButton({ inviteLink }: { inviteLink: string }) {
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      aria-label={copied ? "Invite link copied" : "Copy invite link"}
      onClick={copyInvite}
      type="button"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}
