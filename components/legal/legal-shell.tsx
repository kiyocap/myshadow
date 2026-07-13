import Link from "next/link";
import type { ReactNode } from "react";

import { PetalBloom } from "@/components/brand/petal-bloom";

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <PetalBloom size={24} />
      <span className="font-display text-[19px] font-medium tracking-tightish">Shadow</span>
    </div>
  );
}

/**
 * Shared frame for the legal documents (Terms, Privacy). Mirrors the marketing
 * landing's editorial palette — warm paper, ink, claret accent, Fraunces
 * display type — but keeps a narrow, document-friendly measure for long-form
 * reading.
 */
export function LegalShell({
  eyebrow,
  title,
  lastUpdated,
  intro,
  children
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-20 max-w-[820px] items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Shadow home">
            <LogoMark />
          </Link>
          <Link
            href="/"
            className="text-[13px] tracking-tightish text-muted-foreground transition hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-[820px] px-5 pb-28 pt-16 sm:px-8 sm:pt-24">
        <p className="eyebrow text-claret">{eyebrow}</p>
        <h1 className="mt-6 font-display text-[clamp(2.25rem,6vw,3.75rem)] font-light leading-[1.02] tracking-tighter2 text-balance">
          {title}
        </h1>
        <p className="mt-6 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        <div className="mt-8 max-w-2xl text-[17px] leading-8 text-muted-foreground">{intro}</div>

        <div className="mt-12 space-y-12 border-t border-border pt-12">{children}</div>
      </article>

      <footer className="border-t border-border px-5 pb-12 pt-10 sm:px-8">
        <div className="mx-auto flex max-w-[820px] flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Shadow. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="transition hover:text-foreground">
              Terms of Use
            </Link>
            <Link href="/privacy" className="transition hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/** A numbered legal section with a Fraunces heading and hairline rule. */
export function LegalSection({
  index,
  heading,
  children
}: {
  index: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[auto_1fr] lg:gap-10">
      <div className="flex items-baseline gap-4 lg:flex-col lg:gap-0">
        <span className="font-display text-sm text-claret">({index})</span>
      </div>
      <div>
        <h2 className="font-display text-[clamp(1.4rem,2.6vw,2rem)] font-light leading-tight tracking-tightish text-balance">
          {heading}
        </h2>
        <div className="mt-5 space-y-4 text-[15px] leading-7 text-muted-foreground">{children}</div>
      </div>
    </section>
  );
}

/** Bulleted list styled to match the landing's claret-dot approach lists. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-2 space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 border-t border-border pt-3 text-[15px] leading-7">
          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-claret" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
