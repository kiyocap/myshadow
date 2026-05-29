"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Apple, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignInPanelProps = {
  providers: {
    google: boolean;
    apple: boolean;
    email: boolean;
  };
};

export function SignInPanel({ providers }: SignInPanelProps) {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function unavailable(provider: "Google" | "Apple" | "magic link") {
    setNotice(`${provider} sign-in is waiting for production credentials.`);
  }

  return (
    <div className="border border-border bg-white p-6 shadow-quiet-xl">
      <div>
        <h2 className="text-xl font-semibold">Continue to Shadow</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose a private provider or request a secure magic link.
        </p>
      </div>
      <div className="mt-8 grid gap-3">
        <Button
          variant="secondary"
          className="justify-start"
          onClick={() =>
            providers.google
              ? signIn("google", { callbackUrl: "/dashboard" })
              : unavailable("Google")
          }
          type="button"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold">
            G
          </span>
          Continue with Google
        </Button>
        <Button
          variant="secondary"
          className="justify-start"
          onClick={() =>
            providers.apple
              ? signIn("apple", { callbackUrl: "/dashboard" })
              : unavailable("Apple")
          }
          type="button"
        >
          <Apple className="h-5 w-5" />
          Continue with Apple
        </Button>
      </div>
      <div className="my-8 h-px bg-border" />
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!providers.email) {
            unavailable("magic link");
            return;
          }

          signIn("email", { email, callbackUrl: "/dashboard" });
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
        <Button type="submit" className="w-full">
          <Mail className="h-4 w-4" />
          Send magic link
        </Button>
      </form>
      {notice && (
        <p className="mt-5 border-l border-blue-600 pl-3 text-sm leading-6 text-muted-foreground">
          {notice}
        </p>
      )}
    </div>
  );
}
