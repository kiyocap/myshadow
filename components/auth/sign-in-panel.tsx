"use client";

import type React from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInPanel({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);

  async function continueWithEmail(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setContinuing(true);
    setNotice(null);
    setError(null);

    const response = await fetch("/api/auth/instant-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, callbackUrl })
    });
    const data = (await response.json().catch(() => null)) as {
      callbackUrl?: string;
      error?: string;
    } | null;

    if (!response.ok) {
      setContinuing(false);
      setError(data?.error ?? "Could not continue with this email address.");
      return;
    }

    window.location.href = data?.callbackUrl ?? callbackUrl;
  }

  return (
    <div className="border border-border bg-white p-6 shadow-quiet-xl">
      <div>
        <h2 className="text-xl font-semibold">Continue to Shadow</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter your email to create a private session. Magic links are available
          once email delivery is confirmed.
        </p>
      </div>
      <form
        className="mt-8 space-y-4"
        onSubmit={continueWithEmail}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={continuing || !email}>
          <Mail className="h-4 w-4" />
          {continuing ? "Continuing..." : "Continue with email"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={sendingMagicLink || continuing || !email}
          onClick={async () => {
            setSendingMagicLink(true);
            setNotice(null);
            setError(null);

            const result = await signIn("email", {
              email,
              callbackUrl,
              redirect: false
            });

            setSendingMagicLink(false);

            if (result?.error) {
              setError(
                "Magic link delivery is not available yet. Use Continue with email for now."
              );
              return;
            }

            setNotice(
              `Magic link sent to ${email}. Check inbox and spam. The link can take a minute to arrive.`
            );
          }}
        >
          {sendingMagicLink ? "Sending..." : "Send magic link"}
        </Button>
      </form>
      {notice && (
        <p className="mt-5 border-l border-blue-600 pl-3 text-sm leading-6 text-muted-foreground">
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
