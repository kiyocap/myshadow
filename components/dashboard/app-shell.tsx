import Link from "next/link";
import { BarChart3, Compass, Plus } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { DashboardMobileNav, DashboardNav } from "@/components/dashboard/dashboard-nav";

function ShellLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="24" height="16" viewBox="0 0 26 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.1" opacity="0.9" />
        <circle cx="17" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
      </svg>
      <span className="font-display text-lg font-medium tracking-tightish">Shadow</span>
    </div>
  );
}

export function AppShell({
  children,
  userEmail
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-card px-5 py-6 lg:block">
        <Link href="/" className="flex items-center">
          <ShellLogo />
        </Link>
        <div className="mt-8">
          <Button asChild className="w-full justify-start">
            <Link href="/create-shadow">
              <Plus className="h-4 w-4" />
              Create Shadow
            </Link>
          </Button>
        </div>
        <div className="mt-8">
          <DashboardNav />
        </div>
        <div className="absolute bottom-6 left-5 right-5 space-y-3">
          {/* Shadow active indicator */}
          <Link
            href="/dashboard/discover"
            className="flex items-start gap-3 border border-border bg-background p-3 transition hover:border-foreground/20"
          >
            <span className="relative mt-0.5 flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-claret opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-claret" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">Your shadow is out</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">5 new matches this morning</p>
            </div>
            <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Link>
          <div className="border border-border bg-background p-3">
            <p className="truncate text-xs text-muted-foreground">
              {userEmail ? `Signed in as ${userEmail}` : "Signed in"}
            </p>
            <SignOutButton className="mt-3 w-full justify-center" />
          </div>
          <div className="bg-ink p-4 text-paper">
            <p className="font-display text-sm font-light">Become a patron</p>
            <p className="mt-2 text-xs leading-5 text-paper/60">
              Unlimited introductions, deeper analysis, and keepsake exports.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-4 w-full bg-paper text-ink hover:bg-paper/90"
            >
              <Link href="/dashboard/settings">Upgrade</Link>
            </Button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur sm:px-8">
          <div className="min-w-0">
            <p className="eyebrow text-muted-foreground">Shadow</p>
            <Link href="/dashboard" className="block truncate font-display text-sm">
              Let your minds meet first.
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="icon" aria-label="Create shadow">
              <Link href="/create-shadow">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="icon" aria-label="Open reports">
              <Link href="/dashboard/reports">
                <BarChart3 className="h-4 w-4" />
              </Link>
            </Button>
            <SignOutButton className="hidden sm:inline-flex" />
            <SignOutButton compact className="sm:hidden" />
          </div>
        </header>
        <DashboardMobileNav />
        <main className="max-w-full overflow-x-hidden px-4 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
