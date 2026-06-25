import { CreditCard, KeyRound, Mail, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/dashboard/checkout-button";

const settings = [
  {
    icon: KeyRound,
    title: "Authentication",
    body: "Choose a private sign-in method before imports, transcripts, or reports are saved to an account."
  },
  {
    icon: Mail,
    title: "Notifications",
    body: "Receive meeting links and report updates without exposing the underlying compatibility data."
  },
  {
    icon: CreditCard,
    title: "Billing",
    body: "Premium unlocks unlimited meetings, deeper analysis, and export-ready reports."
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
      <h1 className="mt-5 font-display text-4xl font-light tracking-tightish">Controls for trust and scale</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Manage the parts of Shadow that affect privacy, access, sharing, and
        membership status.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <section key={item.title} className="bg-card p-6">
              <Icon className="h-5 w-5 text-claret" />
              <h2 className="mt-5 font-display text-lg font-light">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </section>
          );
        })}
      </div>

      <section className="mt-6 bg-ink p-6 text-paper">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-light">Patron</h2>
            <p className="mt-2 text-sm text-paper/65">
              Unlimited introductions, deep analysis, keepsake exports.
            </p>
          </div>
          <CheckoutButton />
        </div>
      </section>
    </div>
  );
}
