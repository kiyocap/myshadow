"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setMessage(data.error ?? "Checkout is not available right now.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setMessage("Checkout could not be started. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        className="bg-white text-black hover:bg-white/90"
        onClick={startCheckout}
        type="button"
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {loading ? "Opening checkout" : "Start Stripe checkout"}
      </Button>
      {message && <p className="max-w-sm text-xs leading-5 text-white/60">{message}</p>}
    </div>
  );
}
