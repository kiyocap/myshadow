"use client";

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
  const [sending, setSending] = useState(false);

  return (
    <div className="border border-border bg-white p-6 shadow-quiet-xl">
      <div>
        <h2 className="text-xl font-semibold">Continue to Shadow</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter your email and we&apos;ll send a secure sign-in link.
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
              "Magic link delivery is blocked until the Resend sender domain is verified."
            );
            return;
          }

          setNotice(
            `Magic link sent to ${email}. Check inbox and spam. The link can take a minute to arrive.`
          );
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Magic link</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={sending || !email}>
          <Mail className="h-4 w-4" />
          {sending ? "Sending..." : "Send magic link"}
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
