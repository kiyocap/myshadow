"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size={compact ? "icon" : "sm"}
      className={cn(compact ? "" : "px-3", className)}
      aria-label="Sign out"
      onClick={() => void signOut({ callbackUrl: "/" })}
    >
      <LogOut className="h-4 w-4" />
      {!compact && <span>Sign out</span>}
    </Button>
  );
}
