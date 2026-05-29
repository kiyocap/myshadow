import { CreditCard, KeyRound, Mail, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/dashboard/checkout-button";

const settings = [
  {
    icon: KeyRound,
    title: "Authentication",
    body: "Google, Apple, and magic link sign-in are configured through NextAuth."
  },
  {
    icon: Mail,
    title: "Email",
    body: "Resend handles secure magic links and product notifications."
  },
  {
    icon: CreditCard,
    title: "Billing",
    body: "Stripe checkout unlocks Premium: unlimited meetings, deep analysis, and PDF exports."
  },
  {
    icon: Shield,
    title: "Privacy",
    body: "Imports, transcripts, and reports should remain private unless explicitly shared."
  }
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <Badge tone="blue">Settings</Badge>
      <h1 className="mt-5 text-4xl font-semibold">Controls for trust and scale</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Production integrations are environment-variable gated and ready for
        deployment on Vercel.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <section key={item.title} className="border border-border bg-white p-6">
              <Icon className="h-5 w-5 text-blue-600" />
              <h2 className="mt-5 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </section>
          );
        })}
      </div>

      <section className="mt-6 border border-black bg-black p-6 text-white">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold">Premium</h2>
            <p className="mt-2 text-sm text-white/65">
              Unlimited meetings, deep analysis, PDF exports.
            </p>
          </div>
          <CheckoutButton />
        </div>
      </section>
    </div>
  );
}
