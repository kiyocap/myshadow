"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInPanel({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [usingDemoAccess, setUsingDemoAccess] = useState(false);

  async function continueWithDemoAccess() {
    setUsingDemoAccess(true);
    setNotice(null);
    setError(null);

    const result = await signIn("demo", {
      email: email || "guest@shadow.to",
      callbackUrl,
      redirect: false
    });

    if (result?.error) {
      setUsingDemoAccess(false);
      setError("Demo access is not available right now.");
      return;
    }

    window.location.href = result?.url ?? callbackUrl;
  }

  return (
    <div className="border border-border bg-card p-7">
      <div>
        <h2 className="font-display text-2xl font-light tracking-tightish">Continue to Shadow</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter your email for a secure sign-in link — or step straight in with demo access.
        </p>
        <p className="mt-4 border-l border-claret pl-3 text-xs leading-5 text-muted-foreground">
          Just exploring? Use demo access below to step into the full experience instantly.
        </p>
      </div>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();

          setSending(true);
          setNotice(null);
          setError(null);

          const result = await signIn("email", {
            email,
            callbackUrl,
            redirect: false
          });

          setSending(false);

          if (result?.error) {
            setError(
              "Magic link delivery is unavailable in demo mode. Use demo access below."
            );
            return;
          }

          setNotice(
            `Magic link sent to ${email}. Check inbox and spam. The link can take a minute to arrive.`
          );
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          variant="secondary"
          disabled={sending || usingDemoAccess || !email}
        >
          <Mail className="h-4 w-4" />
          {sending ? "Sending..." : "Send magic link"}
        </Button>
        <Button
          type="button"
          className="w-full"
          disabled={sending || usingDemoAccess}
          onClick={continueWithDemoAccess}
        >
          {usingDemoAccess ? "Entering..." : "Use demo access"}
          {!usingDemoAccess && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
      {notice && (
        <p className="mt-5 border-l border-claret pl-3 text-sm leading-6 text-muted-foreground">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-5 border-l border-red-500 pl-3 text-sm leading-6 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
