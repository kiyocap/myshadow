import Link from "next/link";

import { SignInPanel } from "@/components/auth/sign-in-panel";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="24" height="16" viewBox="0 0 26 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.1" opacity="0.9" />
            <circle cx="17" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
          </svg>
          <span className="font-display text-lg font-medium tracking-tightish">Shadow</span>
        </Link>
        <Link href="/" className="link-underline text-sm text-muted-foreground">
          Back
        </Link>
      </div>
      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-6xl gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow text-claret">Secure access</p>
          <h1 className="mt-6 max-w-xl font-display text-[clamp(2.25rem,5vw,4rem)] font-light leading-[1.04] tracking-tighter2">
            Sign in to keep your representative private.
          </h1>
          <p className="mt-6 max-w-lg leading-7 text-muted-foreground">
            Shadow keeps imports, introductions, and readings behind explicit
            access. Send yourself a secure magic link, or step in instantly with
            demo access.
          </p>
        </div>
        <SignInPanel callbackUrl={callbackUrl ?? "/dashboard"} />
      </section>
    </main>
  );
}
